import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { isTimeFoundryExport, type Settings, type TimeFoundryExport, type TimerMode, type TimerState } from '@time-foundry/core/extension'
import type { TimerHost } from './timer-host'

// Messages the webview sends to the extension host
type WebviewMessage =
  | { type: 'START_WORK'; taskId: string; estimatedMinutes?: number; timerMode?: TimerMode }
  | { type: 'START_BREAK'; breakType: 'shortBreak' | 'longBreak' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' }
  | { type: 'SKIP' }
  | { type: 'EXTEND'; minutes: number }
  | { type: 'READY' }
  | { type: 'CLEAR_PENDING_SESSIONS' }
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; settings: Settings }
  | { type: 'REQUEST_EXPORT_DATA' }
  | { type: 'REQUEST_IMPORT_DATA' }
  | { type: 'EXPORT_DATA_RESPONSE'; payload: TimeFoundryExport }
  | { type: 'IMPORT_DATA_RESPONSE'; payload: TimeFoundryExport }
  | { type: 'PORTABILITY_ERROR'; message: string }

class TimeFoundryWebviewSession {
  private _ready = false
  private readonly _queuedMessages: unknown[] = []
  private readonly _disposables: vscode.Disposable[] = []

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly timerHost: TimerHost,
    private readonly webview: vscode.Webview,
  ) {
    this.webview.html = this._getHtml()
    this.webview.onDidReceiveMessage(
      (msg: WebviewMessage) => void this._handleMessage(msg),
      undefined,
      this._disposables,
    )
  }

  postState(state: TimerState) {
    if (!this._ready) return
    this._postToWebview({ type: 'STATE_UPDATE', state })
  }

  async postPendingSessions() {
    if (!this._ready) return
    const sessions = await this.timerHost.storage.getPendingSessions()
    if (sessions.length > 0) {
      this._postToWebview({ type: 'PENDING_SESSIONS', sessions })
    }
  }

  async requestExport(appVersion?: string) {
    const [timerState, settings, pendingSessions, taskSessionMinutes] = await Promise.all([
      this.timerHost.storage.getTimerState(),
      this.timerHost.storage.getSettings(),
      this.timerHost.storage.getPendingSessions(),
      this.timerHost.storage.getTaskSessionMinutes(),
    ])

    this._postToWebview({
      type: 'EXPORT_DATA_REQUEST',
      appVersion,
      hostData: {
        timerState,
        settings,
        pendingSessions,
        taskSessionMinutes,
      },
    })
  }

  async requestImportFromFile() {
    const payload = await this._readImportPayload()
    if (!payload) return

    const confirmed = await vscode.window.showWarningMessage(
      'Importing Time Foundry data will replace the current local projects, tasks, sessions, timer state, and settings on this machine.',
      { modal: true },
      'Import and Replace',
    )
    if (confirmed !== 'Import and Replace') return

    this._postToWebview({ type: 'IMPORT_DATA_REQUEST', payload })
  }

  dispose() {
    while (this._disposables.length > 0) {
      this._disposables.pop()?.dispose()
    }
  }

  private _postToWebview(message: unknown) {
    if (!this._ready) {
      this._queuedMessages.push(message)
      return
    }
    void this.webview.postMessage(message)
  }

  private _flushQueuedMessages() {
    while (this._queuedMessages.length > 0) {
      void this.webview.postMessage(this._queuedMessages.shift())
    }
  }

  private async _handleMessage(msg: WebviewMessage) {
    switch (msg.type) {
      case 'READY': {
        this._ready = true
        const [state, sessions, settings] = await Promise.all([
          this.timerHost.getState(),
          this.timerHost.storage.getPendingSessions(),
          this.timerHost.storage.getSettings(),
        ])
        this.postState(state)
        void this.webview.postMessage({ type: 'SETTINGS_STATE', settings })
        void this.webview.postMessage({ type: 'PENDING_SESSIONS', sessions })
        this._flushQueuedMessages()
        break
      }
      case 'GET_SETTINGS': {
        const settings = await this.timerHost.storage.getSettings()
        void this.webview.postMessage({ type: 'SETTINGS_STATE', settings })
        break
      }
      case 'UPDATE_SETTINGS':
        await this.timerHost.storage.saveSettings(msg.settings)
        void this.webview.postMessage({ type: 'SETTINGS_STATE', settings: msg.settings })
        break
      case 'REQUEST_EXPORT_DATA':
        await this.requestExport((this.ctx.extension.packageJSON as { version?: string }).version)
        break
      case 'REQUEST_IMPORT_DATA':
        await this.requestImportFromFile()
        break
      case 'CLEAR_PENDING_SESSIONS':
        await this.timerHost.storage.savePendingSessions([])
        break
      case 'START_WORK':
        await this.timerHost.startWork(msg.taskId, msg.estimatedMinutes, msg.timerMode)
        break
      case 'START_BREAK':
        await this.timerHost.startBreak(msg.breakType)
        break
      case 'PAUSE':
        await this.timerHost.pause()
        break
      case 'RESUME':
        await this.timerHost.resume()
        break
      case 'STOP':
        await this.timerHost.stop()
        break
      case 'SKIP':
        await this.timerHost.skip()
        break
      case 'EXTEND':
        await this.timerHost.extend(msg.minutes)
        break
      case 'EXPORT_DATA_RESPONSE':
        await this._writeExportPayload(msg.payload)
        break
      case 'IMPORT_DATA_RESPONSE':
        await this._saveImportedHostData(msg.payload)
        break
      case 'PORTABILITY_ERROR':
        void vscode.window.showErrorMessage(`Time Foundry: ${msg.message}`)
        break
    }
  }

  private async _readImportPayload(): Promise<TimeFoundryExport | undefined> {
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: { JSON: ['json'] },
      title: 'Import Time Foundry Data',
    })
    const uri = uris?.[0]
    if (!uri) return undefined

    try {
      const raw = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8')
      const parsed = JSON.parse(raw) as unknown
      if (!isTimeFoundryExport(parsed)) {
        void vscode.window.showErrorMessage('That file is not a valid Time Foundry export.')
        return undefined
      }
      return parsed
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read the selected file.'
      void vscode.window.showErrorMessage(`Time Foundry import failed: ${message}`)
      return undefined
    }
  }

  private async _writeExportPayload(payload: TimeFoundryExport) {
    const defaultName = `time-foundry-export-${new Date().toISOString().slice(0, 10)}.json`
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultName),
      filters: { JSON: ['json'] },
      saveLabel: 'Export',
      title: 'Export Time Foundry Data',
    })
    if (!uri) return

    const bytes = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, 'utf8')
    await vscode.workspace.fs.writeFile(uri, bytes)
    void vscode.window.showInformationMessage('Time Foundry data exported.')
  }

  private async _saveImportedHostData(payload: TimeFoundryExport) {
    const { data } = payload
    await Promise.all([
      data.settings ? this.timerHost.storage.saveSettings(data.settings) : Promise.resolve(),
      data.timerState ? this.timerHost.storage.saveTimerState(data.timerState) : Promise.resolve(),
      this.timerHost.storage.savePendingSessions(data.pendingSessions ?? []),
      this.timerHost.storage.saveTaskSessionMinutes(data.taskSessionMinutes ?? {}),
    ])
    await this.timerHost.refresh()
    void vscode.window.showInformationMessage('Time Foundry data imported.')
  }

  private _getHtml(): string {
    const webviewDir = path.join(this.ctx.extensionPath, 'dist', 'webview')
    const indexPath = path.join(webviewDir, 'index.html')

    // During development, serve a placeholder until the webview is built.
    if (!fs.existsSync(indexPath)) {
      return `<!DOCTYPE html><html><body>
        <p style="font-family:sans-serif;padding:2rem">
          Time Foundry webview not built yet.<br/>
          Run <code>pnpm build:webview</code> in apps/vscode to build it.
        </p>
      </body></html>`
    }

    let html = fs.readFileSync(indexPath, 'utf8')

    const webviewUri = this.webview.asWebviewUri(
      vscode.Uri.file(webviewDir),
    ).toString()

    html = html.replace(/(src|href)="\/([^"]*)"/g, `$1="${webviewUri}/$2"`)
    // crossorigin triggers CORS checks that VS Code webview resource URIs cannot satisfy.
    html = html.replace(/ crossorigin(="[^"]*")?/g, '')
    html = html.replace(
      /<head>/,
      `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' ${this.webview.cspSource}; style-src 'unsafe-inline' ${this.webview.cspSource}; font-src ${this.webview.cspSource}; img-src ${this.webview.cspSource} data:;">`,
    )

    return html
  }
}

export class WebviewPanel {
  private readonly _panel: vscode.WebviewPanel
  private readonly _session: TimeFoundryWebviewSession
  private _disposeCallbacks: Array<() => void> = []

  constructor(
    ctx: vscode.ExtensionContext,
    timerHost: TimerHost,
  ) {
    this._panel = vscode.window.createWebviewPanel(
      'timeFoundry',
      'Time Foundry',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(ctx.extensionPath, 'dist', 'webview')),
        ],
        retainContextWhenHidden: true,
      },
    )

    this._session = new TimeFoundryWebviewSession(ctx, timerHost, this._panel.webview)

    this._panel.onDidDispose(() => {
      this._session.dispose()
      for (const cb of this._disposeCallbacks) cb()
    })
  }

  reveal() {
    this._panel.reveal()
  }

  postState(state: TimerState) {
    this._session.postState(state)
  }

  postPendingSessions() {
    return this._session.postPendingSessions()
  }

  requestExport(appVersion?: string) {
    return this._session.requestExport(appVersion)
  }

  requestImportFromFile() {
    return this._session.requestImportFromFile()
  }

  onDispose(cb: () => void) {
    this._disposeCallbacks.push(cb)
  }
}
