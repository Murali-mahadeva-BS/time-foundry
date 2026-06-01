// Default stub — each platform overrides this via Vite resolve.alias.
// Chrome maps @ui/stores/timer.store → apps/chrome/src/stores/timer.store.ts
// VS Code maps @ui/stores/timer.store → apps/vscode/webview/src/timer-store.ts
import { create } from 'zustand'
import type { TimerState, SessionType, TimerMode } from '@time-foundry/core'
import { DEFAULT_TIMER } from '@time-foundry/core'

export interface TimerStoreShape {
  state: TimerState
  remainingSeconds: number
  startWork: (taskId: string, estimatedMinutes?: number, timerMode?: TimerMode) => void | Promise<void>
  startBreak: (type: Extract<SessionType, 'shortBreak' | 'longBreak'>) => void | Promise<void>
  pause: () => void | Promise<void>
  resume: () => void | Promise<void>
  stop: () => void | Promise<void>
  skip: () => void | Promise<void>
  extend: (minutes: number) => void | Promise<void>
}

export const useTimerStore = create<TimerStoreShape>(() => ({
  state: { ...DEFAULT_TIMER },
  remainingSeconds: 0,
  startWork: () => {},
  startBreak: () => {},
  pause: () => {},
  resume: () => {},
  stop: () => {},
  skip: () => {},
  extend: () => {},
}))
