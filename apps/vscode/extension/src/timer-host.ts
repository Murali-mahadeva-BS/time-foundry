import * as vscode from 'vscode'
import type { StorageAdapter, TimerState, SessionType } from '@time-foundry/core'
import {
  computeStartTimer,
  computePauseTimer,
  computeResumeTimer,
  computeExtendTimer,
  computeTimerEnd,
  computeSkipSession,
  computeStopTimer,
  buildPendingSession,
  checkEstimateExceeded,
} from '@time-foundry/core'

export class TimerHost {
  private _interval: NodeJS.Timeout | undefined
  private _tickInterval: NodeJS.Timeout | undefined
  private _listeners: Array<(state: TimerState) => void> = []

  constructor(
    readonly storage: StorageAdapter,
    private readonly ctx: vscode.ExtensionContext,
  ) {
    // Check estimate threshold every 15s (mirrors Chrome background behaviour)
    this._interval = setInterval(() => void this._checkEstimate(), 15000)
    // Tick every second to push state updates to webview
    this._tickInterval = setInterval(() => void this._tick(), 1000)
  }

  onStateChange(cb: (state: TimerState) => void): void {
    this._listeners.push(cb)
  }

  private _emit(state: TimerState) {
    for (const cb of this._listeners) cb(state)
  }

  // ── Public timer commands ─────────────────────────────────────────────────

  async startWork(taskId: string, estimatedMinutes?: number) {
    const [current, settings] = await Promise.all([
      this.storage.getTimerState(),
      this.storage.getSettings(),
    ])
    if (current.status !== 'idle') return
    const { state, endTime } = computeStartTimer(taskId, 'work', current, settings, estimatedMinutes)
    await this.storage.saveTimerState(state)
    this._scheduleAlarm(endTime)
    this._emit(state)
  }

  async startBreak(type: Extract<SessionType, 'shortBreak' | 'longBreak'>) {
    const [current, settings] = await Promise.all([
      this.storage.getTimerState(),
      this.storage.getSettings(),
    ])
    const { state, endTime } = computeStartTimer(current.taskId ?? '', type, current, settings)
    await this.storage.saveTimerState(state)
    this._scheduleAlarm(endTime)
    this._emit(state)
  }

  async pause() {
    const current = await this.storage.getTimerState()
    const result = computePauseTimer(current)
    if (!result) return
    this._clearAlarm()
    await this.storage.saveTimerState(result.state)
    this._emit(result.state)
  }

  async resume() {
    const current = await this.storage.getTimerState()
    const result = computeResumeTimer(current)
    if (!result) return
    await this.storage.saveTimerState(result.state)
    this._scheduleAlarm(result.endTime)
    this._emit(result.state)
  }

  async stop() {
    const current = await this.storage.getTimerState()
    if (current.status === 'idle') return
    if (current.sessionType === 'work' && current.taskId && current.currentSessionId) {
      await this._logSession(current, false)
    }
    this._clearAlarm()
    const next = computeStopTimer(current)
    await this.storage.saveTimerState(next)
    this._emit(next)
  }

  async skip() {
    const [current, settings] = await Promise.all([
      this.storage.getTimerState(),
      this.storage.getSettings(),
    ])
    if (current.sessionType === 'work' && current.taskId && current.currentSessionId) {
      await this._logSession(current, false)
    }
    this._clearAlarm()
    const next = computeSkipSession(current, settings)
    await this.storage.saveTimerState(next)
    this._emit(next)
  }

  async extend(minutes: number) {
    const current = await this.storage.getTimerState()
    const result = computeExtendTimer(current, minutes)
    if (!result) return
    this._clearAlarm()
    await this.storage.saveTimerState(result.state)
    this._scheduleAlarm(result.endTime)
    this._emit(result.state)
  }

  async getState(): Promise<TimerState> {
    return this.storage.getTimerState()
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private _alarmTimeout: NodeJS.Timeout | undefined

  private _scheduleAlarm(whenMs: number) {
    this._clearAlarm()
    const delay = Math.max(0, whenMs - Date.now())
    this._alarmTimeout = setTimeout(() => void this._onAlarm(), delay)
  }

  private _clearAlarm() {
    if (this._alarmTimeout) {
      clearTimeout(this._alarmTimeout)
      this._alarmTimeout = undefined
    }
  }

  private async _onAlarm() {
    const [current, settings] = await Promise.all([
      this.storage.getTimerState(),
      this.storage.getSettings(),
    ])

    if (current.sessionType === 'work' && current.taskId && current.currentSessionId) {
      await this._logSession(current, true)
    }

    const { nextState, nextType, title, body, shouldAutoStart } = computeTimerEnd(current, settings)

    vscode.window.showInformationMessage(`${title} ${body}`, 'OK')

    if (shouldAutoStart && current.taskId) {
      const { state, endTime } = computeStartTimer(
        current.taskId,
        nextType,
        nextState,
        settings,
        nextType === 'work' ? current.taskEstimatedMinutes : undefined,
      )
      await this.storage.saveTimerState(state)
      this._scheduleAlarm(endTime)
      this._emit(state)
    } else {
      await this.storage.saveTimerState(nextState)
      this._emit(nextState)
    }
  }

  private async _tick() {
    const state = await this.storage.getTimerState()
    this._emit(state)
  }

  private async _checkEstimate() {
    const [state, taskSessionMinutes] = await Promise.all([
      this.storage.getTimerState(),
      this.storage.getTaskSessionMinutes(),
    ])

    if (!checkEstimateExceeded(state, taskSessionMinutes)) return

    vscode.window.showWarningMessage('Estimate reached — you have crossed the estimated time for this task.')
    await this.storage.saveTimerState({ ...state, estimateExceededNotified: true })
  }

  private async _logSession(state: TimerState, completed: boolean) {
    const session = buildPendingSession(state, completed)
    if (!session) return
    const pending = await this.storage.getPendingSessions()
    pending.push(session)
    const taskMinutes = await this.storage.getTaskSessionMinutes()
    taskMinutes[state.taskId!] = (taskMinutes[state.taskId!] ?? 0) + session.durationMinutes
    await Promise.all([
      this.storage.savePendingSessions(pending),
      this.storage.saveTaskSessionMinutes(taskMinutes),
    ])
  }

  dispose() {
    this._clearAlarm()
    if (this._interval) clearInterval(this._interval)
    if (this._tickInterval) clearInterval(this._tickInterval)
  }
}
