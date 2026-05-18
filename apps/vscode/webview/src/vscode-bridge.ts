import type { Settings, TimerState } from '@time-foundry/core'

// VS Code API injected by the extension host
declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void
  getState(): unknown
  setState(state: unknown): void
}

const vscodeApi = acquireVsCodeApi()

type StateListener = (state: TimerState) => void
type SettingsListener = (settings: Settings) => void
const stateListeners: StateListener[] = []
const settingsListeners: SettingsListener[] = []

window.addEventListener('message', (event) => {
  const msg = event.data as { type: string; state?: TimerState; settings?: Settings }
  if (msg.type === 'STATE_UPDATE' && msg.state) {
    for (const cb of stateListeners) cb(msg.state)
  }
  if (msg.type === 'SETTINGS_STATE' && msg.settings) {
    for (const cb of settingsListeners) cb(msg.settings)
  }
})

export function onTimerStateChange(cb: StateListener): () => void {
  stateListeners.push(cb)
  return () => {
    const i = stateListeners.indexOf(cb)
    if (i !== -1) stateListeners.splice(i, 1)
  }
}

export function sendToHost(msg: object) {
  vscodeApi.postMessage(msg)
}

export function onHostSettingsChange(cb: SettingsListener): () => void {
  settingsListeners.push(cb)
  return () => {
    const i = settingsListeners.indexOf(cb)
    if (i !== -1) settingsListeners.splice(i, 1)
  }
}

export function requestHostSettings() {
  sendToHost({ type: 'GET_SETTINGS' })
}

export function saveHostSettings(settings: Settings) {
  sendToHost({ type: 'UPDATE_SETTINGS', settings })
}

// Tell the extension we are ready so it sends the initial state
export function notifyReady() {
  sendToHost({ type: 'READY' })
}
