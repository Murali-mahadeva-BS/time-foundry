import type { TimerState } from '@time-foundry/core'

// VS Code API injected by the extension host
declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void
  getState(): unknown
  setState(state: unknown): void
}

const vscodeApi = acquireVsCodeApi()

type StateListener = (state: TimerState) => void
const stateListeners: StateListener[] = []

window.addEventListener('message', (event) => {
  const msg = event.data as { type: string; state?: TimerState }
  if (msg.type === 'STATE_UPDATE' && msg.state) {
    for (const cb of stateListeners) cb(msg.state)
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

// Tell the extension we are ready so it sends the initial state
export function notifyReady() {
  sendToHost({ type: 'READY' })
}
