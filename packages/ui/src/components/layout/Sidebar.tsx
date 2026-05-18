import { useState } from 'react'
import {
  BarChart3, Settings, Plus, Trash2, Clock,
  ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon,
  MessageSquarePlus,
} from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useUIStore } from '../../stores/ui.store'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../ui/alert-dialog'
import { NewProjectDialog } from '../projects/NewProjectDialog'
import { IconPicker } from '../ui/icon-picker'
import { ProjectIcon } from '../ui/project-icon'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const projects = useAppStore((s) => s.projects)
  const lists = useAppStore((s) => s.lists)
  const deleteProject = useAppStore((s) => s.deleteProject)
  const updateProject = useAppStore((s) => s.updateProject)
  const updateList = useAppStore((s) => s.updateList)
  const deleteList = useAppStore((s) => s.deleteList)

  const {
    selectedProjectId, selectedListId, selectedView,
    sidebarCollapsed, expandedProjectIds,
    selectProject, selectList, selectView,
    toggleSidebar, toggleProjectExpanded,
  } = useUIStore()

  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-12' : 'w-60',
      )}
    >
      {/* App header */}
      <div className={cn(
        'flex items-center border-b transition-all duration-300',
        sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-2 px-4 py-3',
      )}>
        <Clock className="h-5 w-5 shrink-0 text-primary" />
        {!sidebarCollapsed && (
          <span className="font-semibold text-sm tracking-tight">Time Foundry</span>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-10 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-accent',
        )}
      >
        {sidebarCollapsed
          ? <ChevronRight className="h-3.5 w-3.5" />
          : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {/* Projects section header */}
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-3 pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Projects
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setNewProjectOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New project</TooltipContent>
              </Tooltip>
              <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} />
            </div>
          )}

          {sidebarCollapsed && (
            <div className="flex justify-center pb-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setNewProjectOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New project</TooltipContent>
              </Tooltip>
              <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} />
            </div>
          )}

          {/* Project list */}
          {projects.length === 0 && !sidebarCollapsed && (
            <p className="px-4 py-2 text-xs text-muted-foreground">No projects yet</p>
          )}

          {projects.map((project) => {
            const projectLists = lists
              .filter((l) => l.projectId === project.id)
              .sort((a, b) => a.order - b.order)
            const isExpanded = expandedProjectIds.includes(project.id)
            const isProjectSelected = selectedProjectId === project.id && selectedView === 'project'

            if (sidebarCollapsed) {
              return (
                <Tooltip key={project.id}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'flex w-full items-center justify-center py-1.5 transition-colors hover:bg-accent',
                        isProjectSelected && !selectedListId && 'bg-accent',
                      )}
                      onClick={() => { selectProject(project.id) }}
                    >
                      <ProjectIcon icon={project.icon} fallback="Folder" size="sm" className="text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{project.name}</TooltipContent>
                </Tooltip>
              )
            }

            return (
              <div key={project.id} className="mb-0.5">
                {/* Project row */}
                <div
                  className={cn(
                    'group flex items-center gap-1 rounded-md mx-1 px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                    isProjectSelected && !selectedListId && 'bg-accent font-medium',
                  )}
                >
                  {/* Expand toggle */}
                  <button
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); toggleProjectExpanded(project.id) }}
                  >
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5" />
                      : <ChevronRightIcon className="h-3.5 w-3.5" />}
                  </button>

                  {/* Icon (clickable to pick) */}
                  <IconPicker
                    value={project.icon}
                    onChange={(icon) => updateProject(project.id, { icon })}
                  >
                    <button
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      title="Change icon"
                    >
                      <ProjectIcon icon={project.icon} fallback="Folder" size="sm" />
                    </button>
                  </IconPicker>

                  {/* Name */}
                  {editingProjectId === project.id ? (
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => {
                        const next = nameDraft.trim()
                        if (next && next !== project.name) void updateProject(project.id, { name: next })
                        setEditingProjectId(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const next = nameDraft.trim()
                          if (next && next !== project.name) void updateProject(project.id, { name: next })
                          setEditingProjectId(null)
                        }
                        if (e.key === 'Escape') setEditingProjectId(null)
                      }}
                      className="h-6 min-w-0 flex-1 rounded border bg-background px-1.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="flex-1 truncate cursor-pointer"
                      onClick={() => selectProject(project.id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setEditingProjectId(project.id)
                        setEditingListId(null)
                        setNameDraft(project.name)
                      }}
                    >
                      {project.name}
                    </span>
                  )}

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete <strong>{project.name}</strong> and all its lists and tasks.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteProject(project.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Lists */}
                {isExpanded && (
                  <div className="ml-6 space-y-0.5 mt-0.5">
                    {projectLists.map((list) => {
                      const isListSelected =
                        selectedProjectId === project.id &&
                        selectedListId === list.id &&
                        selectedView === 'project'

                      return (
                        <div
                          key={list.id}
                          className={cn(
                            'group flex items-center gap-1.5 rounded-md mx-1 px-2 py-1 text-sm transition-colors hover:bg-accent cursor-pointer',
                            isListSelected && 'bg-accent font-medium',
                          )}
                          onClick={() => {
                            selectProject(project.id)
                            selectList(list.id)
                          }}
                        >
                          {/* List icon */}
                          <IconPicker
                            value={list.icon}
                            onChange={(icon) => updateList(list.id, { icon })}
                          >
                            <button
                              className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title="Change icon"
                            >
                              <ProjectIcon icon={list.icon} fallback="List" size="sm" />
                            </button>
                          </IconPicker>

                          {editingListId === list.id ? (
                            <input
                              value={nameDraft}
                              onChange={(e) => setNameDraft(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={() => {
                                const next = nameDraft.trim()
                                if (next && next !== list.name) void updateList(list.id, { name: next })
                                setEditingListId(null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const next = nameDraft.trim()
                                  if (next && next !== list.name) void updateList(list.id, { name: next })
                                  setEditingListId(null)
                                }
                                if (e.key === 'Escape') setEditingListId(null)
                              }}
                              className="h-5 min-w-0 flex-1 rounded border bg-background px-1.5 text-xs outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="flex-1 truncate text-xs"
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                setEditingListId(list.id)
                                setEditingProjectId(null)
                                setNameDraft(list.name)
                              }}
                            >
                              {list.name}
                            </span>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete list?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{list.name}</strong> and all its tasks.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteList(list.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )
                    })}

                    {projectLists.length === 0 && (
                      <p className="px-3 py-1 text-xs text-muted-foreground">No lists</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Bottom nav */}
      <div className={cn(
        'border-t py-2',
        sidebarCollapsed ? 'space-y-1 px-1' : 'space-y-0.5 px-2',
      )}>
        {sidebarCollapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => selectView('reports')}
                  className={cn(
                    'flex w-full items-center justify-center rounded-md py-1.5 transition-colors hover:bg-accent',
                    selectedView === 'reports' && 'bg-accent',
                  )}
                >
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Reports</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => selectView('settings')}
                  className={cn(
                    'flex w-full items-center justify-center rounded-md py-1.5 transition-colors hover:bg-accent',
                    selectedView === 'settings' && 'bg-accent',
                  )}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => selectView('feedback')}
                  className={cn(
                    'flex w-full items-center justify-center rounded-md py-1.5 transition-colors hover:bg-accent',
                    selectedView === 'feedback' && 'bg-accent',
                  )}
                >
                  <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Feedback / Contact</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <button
              onClick={() => selectView('reports')}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                selectedView === 'reports' && 'bg-accent font-medium',
              )}
            >
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Reports
            </button>
            <button
              onClick={() => selectView('settings')}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                selectedView === 'settings' && 'bg-accent font-medium',
              )}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </button>
            <button
              onClick={() => selectView('feedback')}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                selectedView === 'feedback' && 'bg-accent font-medium',
              )}
            >
              <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
              Feedback / Contact
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
