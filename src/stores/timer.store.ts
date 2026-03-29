import { create } from 'zustand'
import type { TimerState, SessionType } from '@/types'

const DEFAULT_STATE: TimerState = {
  status: 'idle',
  sessionType: 'work',
  sessionsCompleted: 0,
  elapsedMs: 0,
}

interface TimerStore {
  state: TimerState
  remainingSeconds: number
  load: () => Promise<void>
  tick: () => void
  startWork: (taskId: string) => Promise<void>
  startBreak: (type: Extract<SessionType, 'shortBreak' | 'longBreak'>) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  stop: () => Promise<void>
  skip: () => Promise<void>
  extend: (minutes: number) => Promise<void>
}

async function sendToBackground(type: string, extra?: object) {
  return chrome.runtime.sendMessage({ type, ...extra })
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  state: DEFAULT_STATE,
  remainingSeconds: 0,

  load: async () => {
    const result = await chrome.storage.local.get('timerState')
    const state: TimerState = (result.timerState as TimerState) ?? { ...DEFAULT_STATE }
    set({ state })
    get().tick()
  },

  tick: () => {
    const { state } = get()
    if (state.status === 'running' || state.status === 'break') {
      const remaining = Math.max(0, Math.ceil(((state.endTime ?? Date.now()) - Date.now()) / 1000))
      set({ remainingSeconds: remaining })
    } else if (state.status === 'paused') {
      set({ remainingSeconds: Math.ceil((state.remainingMs ?? 0) / 1000) })
    } else {
      set({ remainingSeconds: 0 })
    }
  },

  startWork: async (taskId) => {
    const { state } = get()
    if (state.status !== 'idle') return
    await sendToBackground('START_TIMER', { taskId, sessionType: 'work' })
    setTimeout(() => get().load(), 150)
  },

  startBreak: async (type) => {
    const { state } = get()
    await sendToBackground('START_TIMER', { taskId: state.taskId, sessionType: type })
    setTimeout(() => get().load(), 150)
  },

  pause: async () => {
    await sendToBackground('PAUSE_TIMER')
    setTimeout(() => get().load(), 150)
  },

  resume: async () => {
    await sendToBackground('RESUME_TIMER')
    setTimeout(() => get().load(), 150)
  },

  stop: async () => {
    await sendToBackground('STOP_TIMER')
    setTimeout(() => get().load(), 150)
  },

  skip: async () => {
    await sendToBackground('SKIP_TIMER')
    setTimeout(() => get().load(), 150)
  },

  extend: async (minutes) => {
    await sendToBackground('EXTEND_TIMER', { minutes })
    setTimeout(() => get().load(), 150)
  },
}))
