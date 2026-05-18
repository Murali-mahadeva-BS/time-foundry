import * as vscode from 'vscode'
import type { StorageAdapter, TimerState, Settings, PomodoroSession } from '@time-foundry/core'
import { DEFAULT_SETTINGS, DEFAULT_TIMER } from '@time-foundry/core'

const KEYS = {
  timerState: 'timerState',
  settings: 'settings',
  pendingSessions: 'pendingSessions',
  taskSessionMinutes: 'taskSessionMinutes',
} as const

export class StorageService implements StorageAdapter {
  constructor(private readonly ctx: vscode.ExtensionContext) {}

  async getTimerState(): Promise<TimerState> {
    return this.ctx.globalState.get<TimerState>(KEYS.timerState) ?? { ...DEFAULT_TIMER }
  }

  async saveTimerState(state: TimerState): Promise<void> {
    await this.ctx.globalState.update(KEYS.timerState, state)
  }

  async getSettings(): Promise<Settings> {
    const stored = this.ctx.globalState.get<Partial<Settings>>(KEYS.settings) ?? {}
    return { ...DEFAULT_SETTINGS, ...stored }
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.ctx.globalState.update(KEYS.settings, settings)
  }

  async getPendingSessions(): Promise<PomodoroSession[]> {
    return this.ctx.globalState.get<PomodoroSession[]>(KEYS.pendingSessions) ?? []
  }

  async savePendingSessions(sessions: PomodoroSession[]): Promise<void> {
    await this.ctx.globalState.update(KEYS.pendingSessions, sessions)
  }

  async getTaskSessionMinutes(): Promise<Record<string, number>> {
    return this.ctx.globalState.get<Record<string, number>>(KEYS.taskSessionMinutes) ?? {}
  }

  async saveTaskSessionMinutes(minutes: Record<string, number>): Promise<void> {
    await this.ctx.globalState.update(KEYS.taskSessionMinutes, minutes)
  }
}
