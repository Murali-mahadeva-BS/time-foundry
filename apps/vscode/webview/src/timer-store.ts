import { create } from 'zustand'
import type { TimerState, SessionType } from '@time-foundry/core'
import { DEFAULT_TIMER } from '@time-foundry/core'
import { sendToHost, onTimerStateChange, notifyReady } from './vscode-bridge'

interface TimerStore {
  state: TimerState
  remainingSeconds: number
  init: () => () => void
  startWork: (taskId: string, estimatedMinutes?: number) => void
  startBreak: (type: Extract<SessionType, 'shortBreak' | 'longBreak'>) => void
  pause: () => void
  resume: () => void
  stop: () => void
  skip: () => void
  extend: (minutes: number) => void
}

function calcRemaining(state: TimerState): number {
  if (state.status === 'running' || state.status === 'break') {
    return Math.max(0, Math.ceil(((state.endTime ?? Date.now()) - Date.now()) / 1000))
  }
  if (state.status === 'paused') return Math.ceil((state.remainingMs ?? 0) / 1000)
  return 0
}

export const useTimerStore = create<TimerStore>((set) => ({
  state: { ...DEFAULT_TIMER },
  remainingSeconds: 0,

  init: () => {
    const unsub = onTimerStateChange((state) => {
      set({ state, remainingSeconds: calcRemaining(state) })
    })
    notifyReady()
    return unsub
  },

  startWork: (taskId, estimatedMinutes) =>
    sendToHost({ type: 'START_WORK', taskId, estimatedMinutes }),

  startBreak: (breakType) =>
    sendToHost({ type: 'START_BREAK', breakType }),

  pause: () => sendToHost({ type: 'PAUSE' }),
  resume: () => sendToHost({ type: 'RESUME' }),
  stop: () => sendToHost({ type: 'STOP' }),
  skip: () => sendToHost({ type: 'SKIP' }),
  extend: (minutes) => sendToHost({ type: 'EXTEND', minutes }),
}))
