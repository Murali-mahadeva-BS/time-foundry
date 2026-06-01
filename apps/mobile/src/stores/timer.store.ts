import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { AppState, type AppStateStatus } from 'react-native'
import type { TimerState, SessionType } from '@time-foundry/core'
import {
  DEFAULT_TIMER,
  computeStartTimer,
  computePauseTimer,
  computeResumeTimer,
  computeExtendTimer,
  computeTimerEnd,
  computeSkipSession,
  computeStopTimer,
  buildPendingSession,
} from '@time-foundry/core'
import { useAppStore } from './app.store'
import { useSettingsStore } from './settings.store'

const TIMER_KEY = 'tf_timer_state'

async function saveTimerState(state: TimerState) {
  await AsyncStorage.setItem(TIMER_KEY, JSON.stringify(state))
}

async function loadTimerState(): Promise<TimerState> {
  try {
    const raw = await AsyncStorage.getItem(TIMER_KEY)
    return raw ? (JSON.parse(raw) as TimerState) : { ...DEFAULT_TIMER }
  } catch {
    return { ...DEFAULT_TIMER }
  }
}

async function scheduleNotification(endTime: number, sessionType: SessionType): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
  const title = sessionType === 'work' ? '🍅 Work session complete!' : '☕ Break over!'
  const body = sessionType === 'work' ? 'Time for a break.' : 'Ready to focus again?'
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(endTime),
    },
  })
}

async function cancelNotification() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

function calcRemaining(state: TimerState): number {
  if (state.status === 'running' || state.status === 'break') {
    return Math.max(0, Math.ceil(((state.endTime ?? Date.now()) - Date.now()) / 1000))
  }
  if (state.status === 'paused') return Math.ceil((state.remainingMs ?? 0) / 1000)
  return 0
}

function isActive(state: TimerState): boolean {
  return state.status === 'running' || state.status === 'break'
}

interface TimerStore {
  state: TimerState
  remainingSeconds: number
  init: () => () => void
  startWork: (taskId: string, estimatedMinutes?: number) => Promise<void>
  startBreak: (type: Extract<SessionType, 'shortBreak' | 'longBreak'>) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  stop: () => Promise<void>
  skip: () => Promise<void>
  extend: (minutes: number) => Promise<void>
}

let tickInterval: ReturnType<typeof setInterval> | undefined

function clearTick() {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = undefined
  }
}

async function logSession(state: TimerState, completed: boolean) {
  const session = buildPendingSession(state, completed)
  if (!session) return
  const tasks = useAppStore.getState().tasks
  const task = tasks.find((t) => t.id === state.taskId)
  if (!task) return
  await useAppStore.getState().insertSession({ ...session, projectId: task.projectId })
}

export const useTimerStore = create<TimerStore>((set, get) => {
  function publish(state: TimerState) {
    set({ state, remainingSeconds: calcRemaining(state) })
    clearTick()
    if (isActive(state)) {
      tickInterval = setInterval(() => {
        set({ remainingSeconds: calcRemaining(get().state) })
      }, 1000)
    }
  }

  async function handleTimerEnd() {
    const current = get().state
    if (!isActive(current)) return
    const settings = useSettingsStore.getState().settings
    if (current.sessionType === 'work' && current.taskId && current.currentSessionId) {
      await logSession(current, true)
    }
    const { nextState, nextType, shouldAutoStart } = computeTimerEnd(current, settings)
    if (shouldAutoStart && current.taskId) {
      const { state, endTime } = computeStartTimer(
        current.taskId,
        nextType,
        nextState,
        settings,
        nextType === 'work' ? current.taskEstimatedMinutes : undefined,
      )
      await saveTimerState(state)
      await scheduleNotification(endTime, nextType)
      publish(state)
    } else {
      await saveTimerState(nextState)
      await cancelNotification()
      publish(nextState)
    }
  }

  return {
    state: { ...DEFAULT_TIMER },
    remainingSeconds: 0,

    init: () => {
      // Request notification permissions
      void Notifications.requestPermissionsAsync()

      // Restore persisted timer state on launch
      void loadTimerState().then(async (state) => {
        // If timer ended while app was backgrounded, process it now
        if (isActive(state) && state.endTime && state.endTime <= Date.now()) {
          await handleTimerEnd()
        } else {
          publish(state)
        }
      })

      // When app comes to foreground, check if timer ended in background
      const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
        if (status === 'active') {
          const current = get().state
          if (isActive(current) && current.endTime && current.endTime <= Date.now()) {
            void handleTimerEnd()
          }
        }
      })

      return () => {
        clearTick()
        subscription.remove()
      }
    },

    startWork: async (taskId, estimatedMinutes) => {
      const settings = useSettingsStore.getState().settings
      const base = get().state.status === 'idle' ? get().state : { ...DEFAULT_TIMER }
      const { state, endTime } = computeStartTimer(taskId, 'work', base, settings, estimatedMinutes)
      await saveTimerState(state)
      await scheduleNotification(endTime, 'work')
      publish(state)
    },

    startBreak: async (breakType) => {
      const settings = useSettingsStore.getState().settings
      const { state, endTime } = computeStartTimer(
        get().state.taskId ?? '',
        breakType,
        get().state,
        settings,
      )
      await saveTimerState(state)
      await scheduleNotification(endTime, breakType)
      publish(state)
    },

    pause: async () => {
      const result = computePauseTimer(get().state)
      if (!result) return
      await cancelNotification()
      await saveTimerState(result.state)
      publish(result.state)
    },

    resume: async () => {
      const result = computeResumeTimer(get().state)
      if (!result) return
      await saveTimerState(result.state)
      await scheduleNotification(result.endTime, get().state.sessionType)
      publish(result.state)
    },

    stop: async () => {
      const current = get().state
      if (current.status === 'idle') return
      if (current.sessionType === 'work' && current.taskId && current.currentSessionId) {
        await logSession(current, false)
      }
      await cancelNotification()
      const next = computeStopTimer(current)
      await saveTimerState(next)
      publish(next)
    },

    skip: async () => {
      const current = get().state
      const settings = useSettingsStore.getState().settings
      if (current.sessionType === 'work' && current.taskId && current.currentSessionId) {
        await logSession(current, false)
      }
      await cancelNotification()
      const next = computeSkipSession(current, settings)
      await saveTimerState(next)
      publish(next)
    },

    extend: async (minutes) => {
      const result = computeExtendTimer(get().state, minutes)
      if (!result) return
      await saveTimerState(result.state)
      await scheduleNotification(result.endTime, get().state.sessionType)
      publish(result.state)
    },
  }
})
