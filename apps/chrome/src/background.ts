import type { TimerState, SessionType, Settings } from '@time-foundry/core'

const TIMER_KEY = 'timerState'
const SETTINGS_KEY = 'settings'
const PENDING_SESSIONS_KEY = 'pendingSessions'
const TASK_SESSION_MINUTES_KEY = 'taskSessionMinutes'

const DEFAULT_SETTINGS: Settings = {
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

const DEFAULT_TIMER: TimerState = {
  status: 'idle',
  sessionType: 'work',
  sessionsCompleted: 0,
  elapsedMs: 0,
}

// Open full page when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })
})

// Handle messages from foreground
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  ;(async () => {
    switch (message.type) {
      case 'START_TIMER':
        await handleStartTimer(
          message.taskId as string,
          message.sessionType as SessionType,
          message.estimatedMinutes as number | undefined,
        )
        sendResponse({ ok: true })
        break
      case 'PAUSE_TIMER':
        await handlePauseTimer()
        sendResponse({ ok: true })
        break
      case 'RESUME_TIMER':
        await handleResumeTimer()
        sendResponse({ ok: true })
        break
      case 'STOP_TIMER':
        await handleStopTimer()
        sendResponse({ ok: true })
        break
      case 'SKIP_TIMER':
        await handleSkipSession()
        sendResponse({ ok: true })
        break
      case 'EXTEND_TIMER':
        await handleExtendTimer(message.minutes as number)
        sendResponse({ ok: true })
        break
      case 'GET_TIMER_STATE':
        sendResponse(await getTimerState())
        break
      case 'SETTINGS_UPDATED':
        await applyIdleThreshold(message.settings as Settings)
        sendResponse({ ok: true })
        break
    }
  })()
  return true // keep channel open for async sendResponse
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'POMODORO_TIMER') {
    handleTimerEnd()
  }
})

chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'idle' || state === 'locked') {
    handleIdleStart()
  } else if (state === 'active') {
    handleIdleEnd()
  }
})

// ── Timer handlers ────────────────────────────────────────────────────────────

async function handleStartTimer(
  taskId: string,
  sessionType: SessionType = 'work',
  estimatedMinutes?: number,
) {
  const settings = await getSettings()
  const durationMs = sessionDurationMs(sessionType, settings)
  const now = Date.now()
  const state = await getTimerState()

  const next: TimerState = {
    status: sessionType === 'work' ? 'running' : 'break',
    sessionType,
    taskId: sessionType === 'work' ? taskId : state.taskId,
    currentSessionId: crypto.randomUUID(),
    endTime: now + durationMs,
    sessionsCompleted: state.sessionsCompleted,
    sessionStartedAt: now,
    elapsedMs: 0,
    taskEstimatedMinutes: sessionType === 'work' ? estimatedMinutes : state.taskEstimatedMinutes,
    estimateExceededNotified: false,
  }

  await saveTimerState(next)
  await chrome.alarms.create('POMODORO_TIMER', { when: next.endTime! })
}

async function handlePauseTimer() {
  const state = await getTimerState()
  if (state.status !== 'running' && state.status !== 'break') return

  const now = Date.now()
  const remaining = Math.max(0, (state.endTime ?? now) - now)
  const elapsed = state.elapsedMs + (now - (state.sessionStartedAt ?? now))

  await chrome.alarms.clear('POMODORO_TIMER')
  await saveTimerState({
    ...state,
    status: 'paused',
    endTime: undefined,
    remainingMs: remaining,
    elapsedMs: elapsed,
    sessionStartedAt: undefined,
  })
}

async function handleResumeTimer() {
  const state = await getTimerState()
  if (state.status !== 'paused') return

  const now = Date.now()
  const remaining = state.remainingMs ?? 0

  await saveTimerState({
    ...state,
    status: state.sessionType === 'work' ? 'running' : 'break',
    endTime: now + remaining,
    remainingMs: undefined,
    sessionStartedAt: now,
    wasRunningBeforeIdle: false,
    idlePausedAt: undefined,
  })
  await chrome.alarms.create('POMODORO_TIMER', { when: now + remaining })
}

async function handleStopTimer() {
  const state = await getTimerState()
  if (state.status === 'idle') return

  if (state.sessionType === 'work' && state.taskId && state.currentSessionId) {
    await logSession(state, false)
  }

  await chrome.alarms.clear('POMODORO_TIMER')
  await saveTimerState({ ...DEFAULT_TIMER, sessionsCompleted: state.sessionsCompleted })
}

async function handleSkipSession() {
  const state = await getTimerState()

  if (state.sessionType === 'work' && state.taskId && state.currentSessionId) {
    await logSession(state, false)
  }

  await chrome.alarms.clear('POMODORO_TIMER')
  const settings = await getSettings()
  const newSessions =
    state.sessionType === 'work' ? state.sessionsCompleted + 1 : state.sessionsCompleted
  const nextType: SessionType =
    state.sessionType === 'work'
      ? newSessions % settings.longBreakAfter === 0
        ? 'longBreak'
        : 'shortBreak'
      : 'work'

  await saveTimerState({
    status: 'idle',
    sessionType: nextType,
    taskId: state.taskId,
    sessionsCompleted: newSessions,
    elapsedMs: 0,
    taskEstimatedMinutes: state.taskEstimatedMinutes,
    estimateExceededNotified: false,
  })
}

async function handleExtendTimer(minutes: number) {
  const state = await getTimerState()
  if (state.status !== 'running' && state.status !== 'break') return

  const newEndTime = (state.endTime ?? Date.now()) + minutes * 60000
  await chrome.alarms.clear('POMODORO_TIMER')
  await saveTimerState({ ...state, endTime: newEndTime })
  await chrome.alarms.create('POMODORO_TIMER', { when: newEndTime })
}

async function handleTimerEnd() {
  const state = await getTimerState()
  const settings = await getSettings()

  if (state.sessionType === 'work' && state.taskId && state.currentSessionId) {
    await logSession(state, true)
  }

  const newSessions =
    state.sessionType === 'work' ? state.sessionsCompleted + 1 : state.sessionsCompleted

  // If skipBreaks is on and a work session just ended, skip the break
  const skipBreak = settings.skipBreaks && state.sessionType === 'work'

  const nextType: SessionType = skipBreak
    ? 'work'
    : state.sessionType === 'work'
      ? newSessions % settings.longBreakAfter === 0
        ? 'longBreak'
        : 'shortBreak'
      : 'work'

  const title = state.sessionType === 'work' ? 'Work session complete!' : 'Break over!'
  const body = skipBreak
    ? 'Break skipped. Ready for the next session!'
    : state.sessionType === 'work'
      ? `Time for a ${nextType === 'longBreak' ? 'long' : 'short'} break.`
      : 'Ready to focus again?'

  chrome.notifications.create(`timer-${Date.now()}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title,
    message: body,
  })

  if (settings.autoStartNextSession && state.taskId) {
    await handleStartTimer(
      state.taskId,
      nextType,
      nextType === 'work' ? state.taskEstimatedMinutes : undefined,
    )
  } else {
    await saveTimerState({
      status: 'idle',
      sessionType: nextType,
      taskId: state.taskId,
      sessionsCompleted: newSessions,
      elapsedMs: 0,
      taskEstimatedMinutes: state.taskEstimatedMinutes,
      estimateExceededNotified: false,
    })
  }
}

async function handleIdleStart() {
  const state = await getTimerState()
  if (state.status !== 'running' && state.status !== 'break') return

  const now = Date.now()
  const remaining = Math.max(0, (state.endTime ?? now) - now)
  const elapsed = state.elapsedMs + (now - (state.sessionStartedAt ?? now))

  await chrome.alarms.clear('POMODORO_TIMER')
  await saveTimerState({
    ...state,
    status: 'paused',
    endTime: undefined,
    remainingMs: remaining,
    elapsedMs: elapsed,
    sessionStartedAt: undefined,
    wasRunningBeforeIdle: true,
    idlePausedAt: now,
  })
}

async function handleIdleEnd() {
  const state = await getTimerState()
  if (!state.wasRunningBeforeIdle || state.status !== 'paused') return

  const now = Date.now()
  const remaining = state.remainingMs ?? 0

  await saveTimerState({
    ...state,
    status: state.sessionType === 'work' ? 'running' : 'break',
    endTime: now + remaining,
    remainingMs: undefined,
    sessionStartedAt: now,
    wasRunningBeforeIdle: false,
    idlePausedAt: undefined,
  })
  await chrome.alarms.create('POMODORO_TIMER', { when: now + remaining })
}

// ── Session logging ───────────────────────────────────────────────────────────

async function logSession(state: TimerState, completed: boolean) {
  const now = Date.now()
  let elapsedMs = state.elapsedMs

  if (state.status === 'running' || state.status === 'break') {
    elapsedMs += now - (state.sessionStartedAt ?? now)
  }

  if (!completed && elapsedMs < 60000) return // skip sessions < 1 min

  const durationMinutes = completed
    ? Math.round(elapsedMs / 60000)
    : Math.round(elapsedMs / 60000)

  const session = {
    id: state.currentSessionId!,
    taskId: state.taskId!,
    projectId: '',
    startedAt: now - elapsedMs,
    endedAt: now,
    durationMinutes,
    completed,
    sessionType: state.sessionType,
  }

  const result = await chrome.storage.local.get(PENDING_SESSIONS_KEY)
  const pending: object[] = (result[PENDING_SESSIONS_KEY] as object[]) ?? []
  pending.push(session)
  const taskMinutesResult = await chrome.storage.local.get(TASK_SESSION_MINUTES_KEY)
  const taskSessionMinutes = (taskMinutesResult[TASK_SESSION_MINUTES_KEY] as Record<string, number> | undefined) ?? {}
  taskSessionMinutes[state.taskId!] = (taskSessionMinutes[state.taskId!] ?? 0) + durationMinutes
  await chrome.storage.local.set({
    [PENDING_SESSIONS_KEY]: pending,
    [TASK_SESSION_MINUTES_KEY]: taskSessionMinutes,
  })
}

// ── Storage helpers ───────────────────────────────────────────────────────────

async function getTimerState(): Promise<TimerState> {
  const result = await chrome.storage.local.get(TIMER_KEY)
  return (result[TIMER_KEY] as TimerState) ?? { ...DEFAULT_TIMER }
}

async function saveTimerState(state: TimerState) {
  await chrome.storage.local.set({ [TIMER_KEY]: state })
}

async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as Partial<Settings> ?? {}) }
}

async function applyIdleThreshold(settings: Settings) {
  const threshold = Math.max(15, (settings.idleThresholdMinutes ?? 5) * 60)
  chrome.idle.setDetectionInterval(threshold)
}

function sessionDurationMs(type: SessionType, settings: Settings): number {
  switch (type) {
    case 'work': return settings.workDuration * 60000
    case 'shortBreak': return settings.shortBreakDuration * 60000
    case 'longBreak': return settings.longBreakDuration * 60000
  }
}

// Init idle detection
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings()
  await applyIdleThreshold(settings)
})

chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings()
  await applyIdleThreshold(settings)
})

// Check estimate thresholds frequently enough for timely notifications.
setInterval(() => {
  void maybeNotifyEstimateExceeded()
}, 15000)

async function maybeNotifyEstimateExceeded() {
  const state = await getTimerState()
  if (state.status !== 'running' || state.sessionType !== 'work' || !state.taskId) return
  if (!state.taskEstimatedMinutes || state.taskEstimatedMinutes <= 0 || state.estimateExceededNotified) return

  const now = Date.now()
  const runningMinutes = Math.floor((state.elapsedMs + Math.max(0, now - (state.sessionStartedAt ?? now))) / 60000)
  const result = await chrome.storage.local.get(TASK_SESSION_MINUTES_KEY)
  const taskSessionMinutes = (result[TASK_SESSION_MINUTES_KEY] as Record<string, number> | undefined) ?? {}
  const completedMinutes = taskSessionMinutes[state.taskId] ?? 0
  const totalMinutes = completedMinutes + runningMinutes

  if (totalMinutes >= state.taskEstimatedMinutes) {
    chrome.notifications.create(`estimate-${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Estimate reached',
      message: 'You have crossed the estimated time for this task.',
    })
    await saveTimerState({ ...state, estimateExceededNotified: true })
  }
}
