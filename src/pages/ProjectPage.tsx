import { useEffect, useState } from 'react'
import { SlidersHorizontal, ListPlus } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useUIStore } from '@/stores/ui.store'
import { useTimerStore } from '@/stores/timer.store'
import { db } from '@/db'
import { Button } from '@/components/ui/button'
import { ProjectIcon } from '@/components/ui/project-icon'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { NewListDialog } from '@/components/lists/NewListDialog'
import { ProjectStatusManager } from '@/components/projects/ProjectStatusManager'

interface ProjectPageProps {
  projectId: string
}

export function ProjectPage({ projectId }: ProjectPageProps) {
  const projects = useAppStore((s) => s.projects)
  const lists = useAppStore((s) => s.lists)
  const tasks = useAppStore((s) => s.tasks)
  const syncPendingSessions = useAppStore((s) => s.syncPendingSessions)
  const { selectedListId, filters, selectList, openTask } = useUIStore()
  const timerStatus = useTimerStore((s) => s.state.status)

  // actual time per task (minutes) queried from DB
  const [actualMinutesMap, setActualMinutesMap] = useState<Record<string, number>>({})

  const project = projects.find((p) => p.id === projectId)

  // Load actual session minutes for all tasks in this project
  useEffect(() => {
    if (!project) return
    const projectTaskIds = tasks.filter((t) => t.projectId === projectId).map((t) => t.id)
    if (projectTaskIds.length === 0) return

    syncPendingSessions().then(() =>
      db.sessions
        .where('taskId')
        .anyOf(projectTaskIds)
        .toArray()
        .then((sessions) => {
          const map: Record<string, number> = {}
          for (const s of sessions) {
            map[s.taskId] = (map[s.taskId] ?? 0) + s.durationMinutes
          }
          setActualMinutesMap(map)
        })
    )
  }, [projectId, tasks.length, timerStatus])

  if (!project) return null

  const projectLists = lists
    .filter((l) => l.projectId === projectId)
    .sort((a, b) => a.order - b.order)

  const filter = filters[projectId] ?? { statusIds: [], sortOrder: 'asc' }

  const visibleLists = selectedListId
    ? projectLists.filter((l) => l.id === selectedListId)
    : projectLists

  const filterTasks = (listId: string) => {
    let listTasks = tasks
      .filter((t) => t.listId === listId)
      .sort((a, b) => a.order - b.order)
    if (filter.statusIds.length > 0) {
      listTasks = listTasks.filter((t) => filter.statusIds.includes(t.statusId))
    }
    if (filter.sortOrder === 'desc') listTasks = listTasks.reverse()
    return listTasks
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <ProjectIcon icon={project.icon} fallback="Folder" className="text-primary" />
          <h1 className="text-base font-semibold">{project.name}</h1>
          {selectedListId && (() => {
            const list = lists.find((l) => l.id === selectedListId)
            return list ? (
              <>
                <span className="text-muted-foreground">/</span>
                <ProjectIcon icon={list.icon} fallback="List" className="text-muted-foreground" />
                <span className="text-sm font-medium">{list.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => selectList(null)}
                >
                  Show all
                </Button>
              </>
            ) : null
          })()}
        </div>
        <div className="flex items-center gap-2">
          <TaskFilters project={project} />
          <ProjectStatusManager project={project}>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Statuses
            </Button>
          </ProjectStatusManager>
          <NewListDialog projectId={projectId}>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <ListPlus className="h-3.5 w-3.5" />
              New List
            </Button>
          </NewListDialog>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {projectLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="mb-2 text-4xl">📋</p>
            <p className="font-medium">No lists yet</p>
            <p className="mb-4 text-sm text-muted-foreground">Create a list to start adding tasks</p>
            <NewListDialog projectId={projectId} />
          </div>
        ) : (
          <div className="divide-y">
            {visibleLists.map((list) => {
              const listTasks = filterTasks(list.id)
              return (
                <div key={list.id} className="px-5 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ProjectIcon icon={list.icon} fallback="List" className="text-muted-foreground" />
                    <h2 className="text-sm font-medium">{list.name}</h2>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {listTasks.length}
                    </span>
                  </div>
                  <TaskTable
                    tasks={listTasks}
                    project={project}
                    listId={list.id}
                    selectedTaskId={null}
                    onSelectTask={(id) => openTask(id)}
                    actualMinutesMap={actualMinutesMap}
                  />
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
