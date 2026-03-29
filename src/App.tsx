import { useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useSettingsStore } from '@/stores/settings.store'
import { useAppStore } from '@/stores/app.store'
import { useUIStore } from '@/stores/ui.store'
import { useTimerStore } from '@/stores/timer.store'

export default function App() {
  const loadSettings = useSettingsStore((s) => s.load)
  const loadAll = useAppStore((s) => s.loadAll)
  const loadFilters = useUIStore((s) => s.loadFilters)
  const loadTimer = useTimerStore((s) => s.load)

  // Bootstrap app on mount
  useEffect(() => {
    Promise.all([loadSettings(), loadAll(), loadFilters(), loadTimer()])
  }, [loadSettings, loadAll, loadFilters, loadTimer])

  // Tick timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      useTimerStore.getState().tick()
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Sync timer state from background every 5s (catches background-driven updates)
  useEffect(() => {
    const interval = setInterval(() => {
      useTimerStore.getState().load()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return <AppShell />
}
