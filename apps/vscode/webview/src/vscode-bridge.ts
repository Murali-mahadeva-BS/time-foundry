import type { Settings, TimeFoundryExport, TimeFoundryExportData, TimerState } from '@time-foundry/core'

// VS Code API injected by the extension host
declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void
  getState(): unknown
  setState(state: unknown): void
}

const vscodeApi = acquireVsCodeApi()

type StateListener = (state: TimerState) => void
type SettingsListener = (settings: Settings) => void
type ExportDataRequest = {
  hostData: Pick<TimeFoundryExportData, 'settings' | 'timerState' | 'pendingSessions' | 'taskSessionMinutes'>
  appVersion?: string
}
type ExportDataRequestListener = (request: ExportDataRequest) => void
type ImportDataRequestListener = (payload: TimeFoundryExport) => void
const stateListeners: StateListener[] = []
const settingsListeners: SettingsListener[] = []
const exportDataRequestListeners: ExportDataRequestListener[] = []
const importDataRequestListeners: ImportDataRequestListener[] = []

window.addEventListener('message', (event) => {
  const msg = event.data as {
    type: string
    state?: TimerState
    settings?: Settings
    hostData?: ExportDataRequest['hostData']
    appVersion?: string
    payload?: TimeFoundryExport
  }
  if (msg.type === 'STATE_UPDATE' && msg.state) {
    for (const cb of stateListeners) cb(msg.state)
  }
  if (msg.type === 'SETTINGS_STATE' && msg.settings) {
    for (const cb of settingsListeners) cb(msg.settings)
  }
  if (msg.type === 'EXPORT_DATA_REQUEST' && msg.hostData) {
    for (const cb of exportDataRequestListeners) cb({ hostData: msg.hostData, appVersion: msg.appVersion })
  }
  if (msg.type === 'IMPORT_DATA_REQUEST' && msg.payload) {
    for (const cb of importDataRequestListeners) cb(msg.payload)
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

export function onExportDataRequest(cb: ExportDataRequestListener): () => void {
  exportDataRequestListeners.push(cb)
  return () => {
    const i = exportDataRequestListeners.indexOf(cb)
    if (i !== -1) exportDataRequestListeners.splice(i, 1)
  }
}

export function onImportDataRequest(cb: ImportDataRequestListener): () => void {
  importDataRequestListeners.push(cb)
  return () => {
    const i = importDataRequestListeners.indexOf(cb)
    if (i !== -1) importDataRequestListeners.splice(i, 1)
  }
}

export function requestHostSettings() {
  sendToHost({ type: 'GET_SETTINGS' })
}

export function saveHostSettings(settings: Settings) {
  sendToHost({ type: 'UPDATE_SETTINGS', settings })
}

export function requestExportData() {
  sendToHost({ type: 'REQUEST_EXPORT_DATA' })
}

export function requestImportData() {
  sendToHost({ type: 'REQUEST_IMPORT_DATA' })
}

export function sendExportData(payload: TimeFoundryExport) {
  sendToHost({ type: 'EXPORT_DATA_RESPONSE', payload })
}

export function sendImportDataComplete(payload: TimeFoundryExport) {
  sendToHost({ type: 'IMPORT_DATA_RESPONSE', payload })
}

export function sendPortabilityError(message: string) {
  sendToHost({ type: 'PORTABILITY_ERROR', message })
}

// Tell the extension we are ready so it sends the initial state
export function notifyReady() {
  sendToHost({ type: 'READY' })
}
