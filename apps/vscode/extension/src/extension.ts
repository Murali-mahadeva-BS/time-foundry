import * as vscode from 'vscode'
import { TimerHost } from './timer-host'
import { StorageService } from './storage-service'
import { WebviewPanel } from './webview-panel'

let timerHost: TimerHost | undefined
let webviewPanel: WebviewPanel | undefined

function formatRemainingSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60).toString().padStart(2, '0')
  const secs = (safeSeconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

export function activate(context: vscode.ExtensionContext) {
  const storage = new StorageService(context)
  timerHost = new TimerHost(storage, context)
  const appVersion = (context.extension.packageJSON as { version?: string }).version

  const ensureWebviewPanel = () => {
    if (webviewPanel) {
      webviewPanel.reveal()
      return webviewPanel
    }

    webviewPanel = new WebviewPanel(context, timerHost!)
    webviewPanel.onDispose(() => { webviewPanel = undefined })
    return webviewPanel
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('timeFoundry.open', () => {
      ensureWebviewPanel()
    }),

    vscode.commands.registerCommand('timeFoundry.startTimer', async () => {
      await vscode.commands.executeCommand('timeFoundry.open')
    }),

    vscode.commands.registerCommand('timeFoundry.pauseTimer', async () => {
      await timerHost?.pause()
    }),

    vscode.commands.registerCommand('timeFoundry.resumeTimer', async () => {
      await timerHost?.resume()
    }),

    vscode.commands.registerCommand('timeFoundry.stopTimer', async () => {
      await timerHost?.stop()
    }),

    vscode.commands.registerCommand('timeFoundry.exportData', async () => {
      const panel = ensureWebviewPanel()
      await panel.requestExport(appVersion)
    }),

    vscode.commands.registerCommand('timeFoundry.importData', async () => {
      const panel = ensureWebviewPanel()
      await panel.requestImportFromFile()
    }),
  )

  const timerStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000)
  timerStatusBar.name = 'Time Foundry Timer'
  timerStatusBar.command = 'timeFoundry.open'
  timerStatusBar.show()

  const timerToggleBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 999)
  timerToggleBar.name = 'Time Foundry Pause or Resume'

  const timerStopBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 998)
  timerStopBar.name = 'Time Foundry Stop Timer'
  timerStopBar.text = '$(debug-stop)'
  timerStopBar.command = 'timeFoundry.stopTimer'
  timerStopBar.tooltip = 'Stop Time Foundry timer'

  context.subscriptions.push(timerStatusBar, timerToggleBar, timerStopBar)

  timerHost.onStateChange((state) => {
    if (state.status === 'running' || state.status === 'break') {
      const remaining = state.endTime
        ? Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000))
        : 0
      const label = state.status === 'break' ? 'Break' : 'Focus'
      timerStatusBar.text = `$(watch) Time Foundry ${formatRemainingSeconds(remaining)} ${label}`
      timerStatusBar.tooltip = 'Open Time Foundry'

      timerToggleBar.text = '$(debug-pause)'
      timerToggleBar.command = 'timeFoundry.pauseTimer'
      timerToggleBar.tooltip = 'Pause Time Foundry timer'
      timerToggleBar.show()
      timerStopBar.show()
    } else if (state.status === 'paused') {
      const remaining = Math.ceil((state.remainingMs ?? 0) / 1000)
      timerStatusBar.text = `$(debug-pause) Time Foundry ${formatRemainingSeconds(remaining)} Paused`
      timerStatusBar.tooltip = 'Open Time Foundry'

      timerToggleBar.text = '$(debug-start)'
      timerToggleBar.command = 'timeFoundry.resumeTimer'
      timerToggleBar.tooltip = 'Resume Time Foundry timer'
      timerToggleBar.show()
      timerStopBar.show()
    } else {
      timerStatusBar.text = '$(watch) Time Foundry'
      timerStatusBar.tooltip = 'Open Time Foundry'
      timerToggleBar.hide()
      timerStopBar.hide()
    }
    webviewPanel?.postState(state)
  })

  timerHost.onSessionsLogged(() => {
    void webviewPanel?.postPendingSessions()
  })

  void timerHost.refresh()
}

export function deactivate() {
  timerHost?.dispose()
}
