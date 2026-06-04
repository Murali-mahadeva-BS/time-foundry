import type {
  List,
  PomodoroSession,
  Project,
  ProjectFilterState,
  Settings,
  Task,
  TimerState,
} from './types/index'

export const TIME_FOUNDRY_EXPORT_FORMAT = 'time-foundry.local-data'
export const TIME_FOUNDRY_EXPORT_VERSION = 1

export interface TimeFoundryExportData {
  projects: Project[]
  lists: List[]
  tasks: Task[]
  sessions: PomodoroSession[]
  settings?: Settings
  timerState?: TimerState
  pendingSessions?: PomodoroSession[]
  taskSessionMinutes?: Record<string, number>
  projectFilters?: Record<string, ProjectFilterState>
}

export interface TimeFoundryExport {
  format: typeof TIME_FOUNDRY_EXPORT_FORMAT
  version: typeof TIME_FOUNDRY_EXPORT_VERSION
  exportedAt: string
  source: 'vscode' | 'chrome' | 'mobile' | 'unknown'
  appVersion?: string
  data: TimeFoundryExportData
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function createTimeFoundryExport(input: {
  source: TimeFoundryExport['source']
  appVersion?: string
  data: TimeFoundryExportData
}): TimeFoundryExport {
  return {
    format: TIME_FOUNDRY_EXPORT_FORMAT,
    version: TIME_FOUNDRY_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    source: input.source,
    appVersion: input.appVersion,
    data: input.data,
  }
}

export function isTimeFoundryExport(value: unknown): value is TimeFoundryExport {
  if (!isRecord(value)) return false
  if (value.format !== TIME_FOUNDRY_EXPORT_FORMAT) return false
  if (value.version !== TIME_FOUNDRY_EXPORT_VERSION) return false
  if (typeof value.exportedAt !== 'string') return false
  if (!isRecord(value.data)) return false

  const data = value.data
  return (
    Array.isArray(data.projects) &&
    Array.isArray(data.lists) &&
    Array.isArray(data.tasks) &&
    Array.isArray(data.sessions)
  )
}
