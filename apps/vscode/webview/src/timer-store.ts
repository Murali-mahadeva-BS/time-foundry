import { create } from 'zustand'
import type { TimerState, SessionType } from '@time-foundry/core'
import {
  DEFAULT_TIMER,
  computeExtendTimer,
  computePauseTimer,
  computeResumeTimer,
  computeSkipSession,
  computeStartTimer,
  computeStopTimer,
  computeTimerEnd,
} from '@time-foundry/core'
import { sendToHost, onTimerStateChange, notifyReady } from './vscode-bridge'
import { useSettingsStore } from './settings.store'

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

let tickInterval: ReturnType<typeof setInterval> | undefined
let alarmTimeout: ReturnType<typeof setTimeout> | undefined
let localSessionId: string | undefined

function isActive(state: TimerState): boolean {
  return state.status === 'running' || state.status === 'break'
}

function clearLocalTimers() {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = undefined
  }
  if (alarmTimeout) {
    clearTimeout(alarmTimeout)
    alarmTimeout = undefined
  }
}

export const useTimerStore = create<TimerStore>((set, get) => {
  const publish = (state: TimerState, local = false) => {
    if (local) localSessionId = state.currentSessionId
    set({ state, remainingSeconds: calcRemaining(state) })
    scheduleLocalTimers()
  }

  const completeLocalTimer = () => {
    const current = get().state
    if (!isActive(current)) return

    const settings = useSettingsStore.getState().settings
    const { nextState, nextType, shouldAutoStart } = computeTimerEnd(current, settings)

    if (shouldAutoStart && current.taskId) {
      const { state } = computeStartTimer(
        current.taskId,
        nextType,
        nextState,
        settings,
        nextType === 'work' ? current.taskEstimatedMinutes : undefined,
      )
      publish(state, true)
      if (nextType === 'work') {
        sendToHost({
          type: 'START_WORK',
          taskId: current.taskId,
          estimatedMinutes: current.taskEstimatedMinutes,
        })
      } else {
        sendToHost({ type: 'START_BREAK', breakType: nextType })
      }
    } else {
      localSessionId = undefined
      publish(nextState)
    }
  }

  const scheduleLocalTimers = () => {
    clearLocalTimers()
    const state = get().state
    if (!isActive(state)) return

    tickInterval = setInterval(() => {
      set({ remainingSeconds: calcRemaining(get().state) })
    }, 1000)

    const remainingMs = Math.max(0, (state.endTime ?? Date.now()) - Date.now())
    alarmTimeout = setTimeout(completeLocalTimer, remainingMs + 250)
  }

  return {
    state: { ...DEFAULT_TIMER },
    remainingSeconds: 0,

    init: () => {
      const unsub = onTimerStateChange((state) => {
        const current = get().state
        if (
          localSessionId &&
          current.status !== 'idle' &&
          state.currentSessionId !== localSessionId
        ) {
          return
        }
        localSessionId = undefined
        publish(state)
      })
      notifyReady()
      return () => {
        clearLocalTimers()
        unsub()
      }
    },

    startWork: (taskId, estimatedMinutes) => {
      const settings = useSettingsStore.getState().settings
      const baseState = get().state.status === 'idle' ? get().state : { ...DEFAULT_TIMER }
      const { state } = computeStartTimer(taskId, 'work', baseState, settings, estimatedMinutes)
      publish(state, true)
      sendToHost({ type: 'START_WORK', taskId, estimatedMinutes })
    },

    startBreak: (breakType) => {
      const settings = useSettingsStore.getState().settings
      const { state } = computeStartTimer(get().state.taskId ?? '', breakType, get().state, settings)
      publish(state, true)
      sendToHost({ type: 'START_BREAK', breakType })
    },

    pause: () => {
      const result = computePauseTimer(get().state)
      if (result) publish(result.state, true)
      sendToHost({ type: 'PAUSE' })
    },

    resume: () => {
      const result = computeResumeTimer(get().state)
      if (result) publish(result.state, true)
      sendToHost({ type: 'RESUME' })
    },

    stop: () => {
      localSessionId = undefined
      publish(computeStopTimer(get().state))
      sendToHost({ type: 'STOP' })
    },

    skip: () => {
      const next = computeSkipSession(get().state, useSettingsStore.getState().settings)
      localSessionId = undefined
      publish(next)
      sendToHost({ type: 'SKIP' })
    },

    extend: (minutes) => {
      const result = computeExtendTimer(get().state, minutes)
      if (result) publish(result.state, true)
      sendToHost({ type: 'EXTEND', minutes })
    },
  }
})
