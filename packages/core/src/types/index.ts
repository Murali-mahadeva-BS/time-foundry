export type Priority = 'urgent' | 'high' | 'medium' | 'low'
export type SessionType = 'work' | 'shortBreak' | 'longBreak'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'break'
export type TimerMode = 'pomodoro' | 'free'

export interface Status {
  id: string
  name: string
  color: string
  order: number
}

export interface Project {
  id: string
  name: string
  description?: string
  icon?: string
  statuses: Status[]
  createdAt: number
  updatedAt: number
}

export interface List {
  id: string
  projectId: string
  name: string
  icon?: string
  order: number
  createdAt: number
}

export interface Task {
  id: string
  projectId: string
  listId: string
  title: string
  notes?: string
  content?: string
  estimatedMinutes: number
  timerMode: TimerMode
  priority: Priority
  statusId: string
  order: number
  createdAt: number
  updatedAt: number
}

export interface PomodoroSession {
  id: string
  taskId: string
  projectId: string
  startedAt: number
  endedAt: number
  durationMinutes: number
  completed: boolean
  sessionType: SessionType
  timerMode: TimerMode
}

export interface TimerState {
  status: TimerStatus
  sessionType: SessionType
  timerMode: TimerMode
  taskId?: string
  currentSessionId?: string
  endTime?: number
  remainingMs?: number
  sessionsCompleted: number
  sessionStartedAt?: number
  elapsedMs: number
  wasRunningBeforeIdle?: boolean
  idlePausedAt?: number
  taskEstimatedMinutes?: number
  estimateExceededNotified?: boolean
}

export type Theme = 'system' | 'light' | 'dark'
export type ColorTheme = 'sky' | 'deepsea' | 'foundry' | 'neonrose' | 'earth' | 'steel' | 'candy' | 'custom'

export interface Settings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  longBreakAfter: number
  idleThresholdMinutes: number
  skipBreaks: boolean
  defaultTimerMode: TimerMode
  theme: Theme
  colorTheme: ColorTheme
  customPrimary: string
}

export interface ProjectFilterState {
  statusIds: string[]
  sortOrder: 'asc' | 'desc'
}
