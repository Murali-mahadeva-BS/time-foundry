import { useEffect } from 'react'
import { AppShell } from '@ui/components/layout/AppShell'
import { useSettingsStore } from '@/stores/settings.store'
import { useAppStore } from '@ui/stores/app.store'
import { useUIStore } from '@ui/stores/ui.store'
import { useTimerStore } from '@/stores/timer.store'
import { db } from '@time-foundry/core'
import type { PomodoroSession } from '@time-foundry/core'

async function syncPendingSessions() {
  const result = await chrome.storage.local.get('pendingSessions')
  const pending = (result.pendingSessions as (PomodoroSession & { projectId?: string })[]) ?? []
  if (pending.length === 0) return
  const tasks = useAppStore.getState().tasks
  const enriched = pending
    .map((s) => {
      if (!s.projectId) {
        const task = tasks.find((t) => t.id === s.taskId)
        return { ...s, projectId: task?.projectId ?? '' }
      }
      return s
    })
    .filter((s) => s.projectId) as PomodoroSession[]
  if (enriched.length > 0) await db.sessions.bulkPut(enriched)
  await chrome.storage.local.set({ pendingSessions: [] })
}

export default function App() {
  const loadSettings = useSettingsStore((s) => s.load)
  const loadAll = useAppStore((s) => s.loadAll)
  const loadFilters = useUIStore((s) => s.loadFilters)
  const loadTimer = useTimerStore((s) => s.load)

  useEffect(() => {
    Promise.all([loadSettings(), loadAll(), loadTimer()])
      .then(() => syncPendingSessions())
    loadFilters()
  }, [loadSettings, loadAll, loadFilters, loadTimer])

  useEffect(() => {
    const interval = setInterval(() => useTimerStore.getState().tick(), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => useTimerStore.getState().load(), 5000)
    return () => clearInterval(interval)
  }, [])

  return <AppShell />
}
