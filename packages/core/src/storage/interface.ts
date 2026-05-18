import type { TimerState, Settings, PomodoroSession } from '../types/index'

export interface StorageAdapter {
  getTimerState(): Promise<TimerState>
  saveTimerState(state: TimerState): Promise<void>
  getSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<void>
  getPendingSessions(): Promise<PomodoroSession[]>
  savePendingSessions(sessions: PomodoroSession[]): Promise<void>
  getTaskSessionMinutes(): Promise<Record<string, number>>
  saveTaskSessionMinutes(minutes: Record<string, number>): Promise<void>
}

export interface AlarmAdapter {
  schedule(name: string, whenMs: number): Promise<void>
  clear(name: string): Promise<void>
}

export interface NotificationAdapter {
  show(title: string, body: string, iconPath?: string): void
}
