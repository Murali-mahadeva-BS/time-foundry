import * as vscode from 'vscode'
import { TimerHost } from './timer-host'
import { StorageService } from './storage-service'
import { WebviewPanel } from './webview-panel'

let timerHost: TimerHost | undefined
let webviewPanel: WebviewPanel | undefined

export function activate(context: vscode.ExtensionContext) {
  const storage = new StorageService(context)
  timerHost = new TimerHost(storage, context)

  context.subscriptions.push(
    vscode.commands.registerCommand('timeFoundry.open', () => {
      if (webviewPanel) {
        webviewPanel.reveal()
      } else {
        webviewPanel = new WebviewPanel(context, timerHost!)
        webviewPanel.onDispose(() => { webviewPanel = undefined })
      }
    }),

    vscode.commands.registerCommand('timeFoundry.startTimer', async () => {
      await vscode.commands.executeCommand('timeFoundry.open')
    }),
  )

  // Status bar item for quick timer visibility
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
  statusBar.command = 'timeFoundry.open'
  statusBar.show()
  context.subscriptions.push(statusBar)

  timerHost.onStateChange((state) => {
    if (state.status === 'running' || state.status === 'break') {
      const remaining = state.endTime
        ? Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000))
        : 0
      const mins = Math.floor(remaining / 60).toString().padStart(2, '0')
      const secs = (remaining % 60).toString().padStart(2, '0')
      const icon = state.status === 'break' ? '☕' : '🍅'
      statusBar.text = `${icon} ${mins}:${secs}`
    } else if (state.status === 'paused') {
      statusBar.text = '⏸ Paused'
    } else {
      statusBar.text = '🍅 Time Foundry'
    }
    webviewPanel?.postState(state)
  })
}

export function deactivate() {
  timerHost?.dispose()
}
