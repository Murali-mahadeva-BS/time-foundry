import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import type { Settings, TimerState } from '@time-foundry/core'
import type { TimerHost } from './timer-host'

// Messages the webview sends to the extension host
type WebviewMessage =
  | { type: 'START_WORK'; taskId: string; estimatedMinutes?: number }
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

export class WebviewPanel {
  private readonly _panel: vscode.WebviewPanel
  private _disposeCallbacks: Array<() => void> = []

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly timerHost: TimerHost,
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

    this._panel.webview.html = this._getHtml()

    this._panel.webview.onDidReceiveMessage(
      (msg: WebviewMessage) => void this._handleMessage(msg),
      undefined,
      ctx.subscriptions,
    )

    this._panel.onDidDispose(() => {
      for (const cb of this._disposeCallbacks) cb()
    })
  }

  reveal() {
    this._panel.reveal()
  }

  postState(state: TimerState) {
    void this._panel.webview.postMessage({ type: 'STATE_UPDATE', state })
  }

  onDispose(cb: () => void) {
    this._disposeCallbacks.push(cb)
  }

  private async _handleMessage(msg: WebviewMessage) {
    switch (msg.type) {
      case 'READY': {
        const [state, sessions, settings] = await Promise.all([
          this.timerHost.getState(),
          this.timerHost.storage.getPendingSessions(),
          this.timerHost.storage.getSettings(),
        ])
        this.postState(state)
        void this._panel.webview.postMessage({ type: 'SETTINGS_STATE', settings })
        void this._panel.webview.postMessage({ type: 'PENDING_SESSIONS', sessions })
        break
      }
      case 'GET_SETTINGS': {
        const settings = await this.timerHost.storage.getSettings()
        void this._panel.webview.postMessage({ type: 'SETTINGS_STATE', settings })
        break
      }
      case 'UPDATE_SETTINGS':
        await this.timerHost.storage.saveSettings(msg.settings)
        void this._panel.webview.postMessage({ type: 'SETTINGS_STATE', settings: msg.settings })
        break
      case 'CLEAR_PENDING_SESSIONS':
        await this.timerHost.storage.savePendingSessions([])
        break
      case 'START_WORK':
        await this.timerHost.startWork(msg.taskId, msg.estimatedMinutes)
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
    }
  }

  private _getHtml(): string {
    const webviewDir = path.join(this.ctx.extensionPath, 'dist', 'webview')
    const indexPath = path.join(webviewDir, 'index.html')

    // During development, serve a placeholder until the webview is built
    if (!fs.existsSync(indexPath)) {
      return `<!DOCTYPE html><html><body>
        <p style="font-family:sans-serif;padding:2rem">
          Time Foundry webview not built yet.<br/>
          Run <code>pnpm build:webview</code> in apps/vscode to build it.
        </p>
      </body></html>`
    }

    let html = fs.readFileSync(indexPath, 'utf8')

    // Rewrite asset paths to VS Code webview URIs
    const webviewUri = this._panel.webview.asWebviewUri(
      vscode.Uri.file(webviewDir),
    ).toString()

    html = html.replace(/(src|href)="\/([^"]*)"/g, `$1="${webviewUri}/$2"`)
    // crossorigin attribute triggers CORS checks that vscode-resource:// cannot satisfy
    html = html.replace(/ crossorigin(="[^"]*")?/g, '')
    html = html.replace(
      /<head>/,
      `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' ${this._panel.webview.cspSource}; style-src 'unsafe-inline' ${this._panel.webview.cspSource}; font-src ${this._panel.webview.cspSource}; img-src ${this._panel.webview.cspSource} data:;">`,
    )

    return html
  }
}
