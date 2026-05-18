import { TooltipProvider } from '../ui/tooltip'
import { Sidebar } from './Sidebar'
import { PomodoroBar } from './PomodoroBar'
import { ProjectPage } from '../../pages/ProjectPage'
import { TaskPage } from '../../pages/TaskPage'
import { ReportsPage } from '../../pages/ReportsPage'
import { SettingsPanel } from '../settings/SettingsPanel'
import { FeedbackPage } from '../../pages/FeedbackPage'
import { useUIStore } from '../../stores/ui.store'
import { useAppStore } from '../../stores/app.store'
import { FolderOpen } from 'lucide-react'

export function AppShell() {
  const { selectedView, selectedProjectId, selectedTaskId } = useUIStore()
  const projects = useAppStore((s) => s.projects)

  const renderMain = () => {
    // Task detail page takes priority
    if (selectedTaskId) return <TaskPage taskId={selectedTaskId} />

    if (selectedView === 'reports') return <ReportsPage />
    if (selectedView === 'settings') return <SettingsPanel />
    if (selectedView === 'feedback') return <FeedbackPage />

    if (!selectedProjectId || !projects.find((p) => p.id === selectedProjectId)) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No project selected</p>
            <p className="text-sm text-muted-foreground">Create or select a project from the sidebar</p>
          </div>
        </div>
      )
    }

    return <ProjectPage projectId={selectedProjectId} />
  }

  const routeKey = selectedTaskId ?? (selectedView + (selectedProjectId ?? ''))

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex flex-1 flex-col overflow-hidden animate-fade-in" key={routeKey}>
            {renderMain()}
          </main>
          <PomodoroBar />
        </div>
      </div>
    </TooltipProvider>
  )
}
