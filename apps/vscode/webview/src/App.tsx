import { useEffect } from 'react'
import { AppShell } from '@ui/components/layout/AppShell'
import { useAppStore } from '@ui/stores/app.store'
import { useUIStore } from '@ui/stores/ui.store'
import { useSettingsStore } from './settings.store'
import { useTimerStore } from './timer-store'
import { db } from '@time-foundry/core'
import type { PomodoroSession } from '@time-foundry/core'
import { exportLocalData, importLocalData } from './data-portability'
import {
  onExportDataRequest,
  onImportDataRequest,
  requestExportData,
  requestImportData,
  sendExportData,
  sendImportDataComplete,
  sendPortabilityError,
  sendToHost,
} from './vscode-bridge'

async function syncPendingSessions(sessions: PomodoroSession[]) {
  if (sessions.length === 0) return
  const tasks = useAppStore.getState().tasks
  const enriched = (await Promise.all(
    sessions.map(async (s) => {
      if (s.projectId) return s
      const task = tasks.find((t) => t.id === s.taskId) ?? await db.tasks.get(s.taskId)
      return { ...s, projectId: task?.projectId ?? '' }
    }),
  )).filter((s) => s.projectId) as PomodoroSession[]
  if (enriched.length > 0) await db.sessions.bulkPut(enriched)
  sendToHost({ type: 'CLEAR_PENDING_SESSIONS' })
  window.dispatchEvent(new Event('time-foundry:sessions-updated'))
}

export default function App() {
  const loadSettings = useSettingsStore((s) => s.load)
  const loadAll = useAppStore((s) => s.loadAll)
  const loadFilters = useUIStore((s) => s.loadFilters)
  const init = useTimerStore((s) => s.init)

  useEffect(() => {
    const unsubExport = onExportDataRequest(({ hostData, appVersion }) => {
      void exportLocalData(hostData, appVersion)
        .then(sendExportData)
        .catch((error: unknown) => {
          sendPortabilityError(error instanceof Error ? error.message : 'Export failed.')
        })
    })

    const unsubImport = onImportDataRequest((payload) => {
      void importLocalData(payload)
        .then(() => {
          sendImportDataComplete(payload)
          window.setTimeout(() => window.location.reload(), 300)
        })
        .catch((error: unknown) => {
          sendPortabilityError(error instanceof Error ? error.message : 'Import failed.')
        })
    })

    return () => {
      unsubExport()
      unsubImport()
    }
  }, [])

  useEffect(() => {
    const unsub = init()
    return unsub
  }, [init])

  useEffect(() => {
    Promise.all([loadSettings(), loadAll()])
    loadFilters()
  }, [loadSettings, loadAll, loadFilters])

  // Listen for pending sessions sent back from the extension host on READY
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data as { type: string; sessions?: PomodoroSession[] }
      if (msg.type === 'PENDING_SESSIONS' && msg.sessions) {
        void syncPendingSessions(msg.sessions)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return (
    <AppShell
      settingsDataActions={{
        onExportData: requestExportData,
        onImportData: requestImportData,
      }}
    />
  )
}
