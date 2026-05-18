import type { TimerState, SessionType, Settings, PomodoroSession } from '../types/index'

export const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakAfter: 4,
  idleThresholdMinutes: 5,
  skipBreaks: false,
  autoStartNextSession: true,
  theme: 'system',
  colorTheme: 'sky',
  customPrimary: '#30BCED',
}

export const DEFAULT_TIMER: TimerState = {
  status: 'idle',
  sessionType: 'work',
  sessionsCompleted: 0,
  elapsedMs: 0,
}

export function sessionDurationMs(type: SessionType, settings: Settings): number {
  switch (type) {
    case 'work': return settings.workDuration * 60000
    case 'shortBreak': return settings.shortBreakDuration * 60000
    case 'longBreak': return settings.longBreakDuration * 60000
  }
}

export function nextSessionType(
  current: SessionType,
  sessionsCompleted: number,
  settings: Settings,
): SessionType {
  if (current !== 'work') return 'work'
  const newCount = sessionsCompleted + 1
  return newCount % settings.longBreakAfter === 0 ? 'longBreak' : 'shortBreak'
}

export interface StartTimerResult {
  state: TimerState
  endTime: number
}

export function computeStartTimer(
  taskId: string,
  sessionType: SessionType,
  current: TimerState,
  settings: Settings,
  estimatedMinutes?: number,
): StartTimerResult {
  const now = Date.now()
  const durationMs = sessionDurationMs(sessionType, settings)
  const endTime = now + durationMs

  const state: TimerState = {
    status: sessionType === 'work' ? 'running' : 'break',
    sessionType,
    taskId: sessionType === 'work' ? taskId : current.taskId,
    currentSessionId: crypto.randomUUID(),
    endTime,
    sessionsCompleted: current.sessionsCompleted,
    sessionStartedAt: now,
    elapsedMs: 0,
    taskEstimatedMinutes: sessionType === 'work' ? estimatedMinutes : current.taskEstimatedMinutes,
    estimateExceededNotified: false,
  }

  return { state, endTime }
}

export interface PauseTimerResult {
  state: TimerState
}

export function computePauseTimer(current: TimerState): PauseTimerResult | null {
  if (current.status !== 'running' && current.status !== 'break') return null

  const now = Date.now()
  const remaining = Math.max(0, (current.endTime ?? now) - now)
  const elapsed = current.elapsedMs + (now - (current.sessionStartedAt ?? now))

  return {
    state: {
      ...current,
      status: 'paused',
      endTime: undefined,
      remainingMs: remaining,
      elapsedMs: elapsed,
      sessionStartedAt: undefined,
    },
  }
}

export interface ResumeTimerResult {
  state: TimerState
  endTime: number
}

export function computeResumeTimer(current: TimerState): ResumeTimerResult | null {
  if (current.status !== 'paused') return null

  const now = Date.now()
  const remaining = current.remainingMs ?? 0

  return {
    state: {
      ...current,
      status: current.sessionType === 'work' ? 'running' : 'break',
      endTime: now + remaining,
      remainingMs: undefined,
      sessionStartedAt: now,
      wasRunningBeforeIdle: false,
      idlePausedAt: undefined,
    },
    endTime: now + remaining,
  }
}

export interface ExtendTimerResult {
  state: TimerState
  endTime: number
}

export function computeExtendTimer(current: TimerState, minutes: number): ExtendTimerResult | null {
  if (current.status !== 'running' && current.status !== 'break') return null

  const endTime = (current.endTime ?? Date.now()) + minutes * 60000
  return { state: { ...current, endTime }, endTime }
}

export function computeTimerEnd(
  current: TimerState,
  settings: Settings,
): { nextState: TimerState; nextType: SessionType; title: string; body: string; shouldAutoStart: boolean } {
  const newSessions =
    current.sessionType === 'work' ? current.sessionsCompleted + 1 : current.sessionsCompleted

  const skipBreak = settings.skipBreaks && current.sessionType === 'work'

  const nextType: SessionType = skipBreak
    ? 'work'
    : nextSessionType(current.sessionType, current.sessionsCompleted, settings)

  const title = current.sessionType === 'work' ? 'Work session complete!' : 'Break over!'
  const body = skipBreak
    ? 'Break skipped. Ready for the next session!'
    : current.sessionType === 'work'
      ? `Time for a ${nextType === 'longBreak' ? 'long' : 'short'} break.`
      : 'Ready to focus again?'

  const idleState: TimerState = {
    status: 'idle',
    sessionType: nextType,
    taskId: current.taskId,
    sessionsCompleted: newSessions,
    elapsedMs: 0,
    taskEstimatedMinutes: current.taskEstimatedMinutes,
    estimateExceededNotified: false,
  }

  return {
    nextState: idleState,
    nextType,
    title,
    body,
    shouldAutoStart: settings.autoStartNextSession && !!current.taskId,
  }
}

export function computeSkipSession(
  current: TimerState,
  settings: Settings,
): TimerState {
  const newSessions =
    current.sessionType === 'work' ? current.sessionsCompleted + 1 : current.sessionsCompleted
  const nextType = nextSessionType(current.sessionType, current.sessionsCompleted, settings)

  return {
    status: 'idle',
    sessionType: nextType,
    taskId: current.taskId,
    sessionsCompleted: newSessions,
    elapsedMs: 0,
    taskEstimatedMinutes: current.taskEstimatedMinutes,
    estimateExceededNotified: false,
  }
}

export function computeStopTimer(current: TimerState): TimerState {
  return { ...DEFAULT_TIMER, sessionsCompleted: current.sessionsCompleted }
}

export function buildPendingSession(state: TimerState, completed: boolean): PomodoroSession | null {
  const now = Date.now()
  let elapsedMs = state.elapsedMs

  if (state.status === 'running' || state.status === 'break') {
    elapsedMs += now - (state.sessionStartedAt ?? now)
  }

  if (!completed && elapsedMs < 60000) return null

  return {
    id: state.currentSessionId!,
    taskId: state.taskId!,
    projectId: '',
    startedAt: now - elapsedMs,
    endedAt: now,
    durationMinutes: Math.round(elapsedMs / 60000),
    completed,
    sessionType: state.sessionType,
  }
}

export function checkEstimateExceeded(
  state: TimerState,
  taskSessionMinutes: Record<string, number>,
): boolean {
  if (state.status !== 'running' || state.sessionType !== 'work' || !state.taskId) return false
  if (!state.taskEstimatedMinutes || state.taskEstimatedMinutes <= 0 || state.estimateExceededNotified) return false

  const now = Date.now()
  const runningMinutes = Math.floor(
    (state.elapsedMs + Math.max(0, now - (state.sessionStartedAt ?? now))) / 60000,
  )
  const completedMinutes = taskSessionMinutes[state.taskId] ?? 0
  return completedMinutes + runningMinutes >= state.taskEstimatedMinutes
}
