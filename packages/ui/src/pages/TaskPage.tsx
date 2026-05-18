import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Play, Clock, Flag, Layers } from 'lucide-react'
import type { Task } from '@time-foundry/core'
import { useAppStore } from '../stores/app.store'
import { useUIStore } from '../stores/ui.store'
import { RichTextEditor } from '../components/editor/RichTextEditor'
import { useTimerStore } from '@ui/stores/timer.store'
import { ProjectIcon } from '../components/ui/project-icon'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { formatDuration, parseTimeInput } from '../lib/time'
import { cn } from '../lib/utils'
import { db } from '@time-foundry/core'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', className: 'border-red-500/30 bg-red-500/10 text-red-500' },
  high: { label: 'High', className: 'border-orange-500/30 bg-orange-500/10 text-orange-500' },
  medium: { label: 'Medium', className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  low: { label: 'Low', className: 'border-border bg-muted text-muted-foreground' },
}

interface TaskPageProps {
  taskId: string
}

export function TaskPage({ taskId }: TaskPageProps) {
  const tasks = useAppStore((s) => s.tasks)
  const projects = useAppStore((s) => s.projects)
  const lists = useAppStore((s) => s.lists)
  const updateTask = useAppStore((s) => s.updateTask)
  const { openTask, selectProject, selectList } = useUIStore()
  const { startWork, state: timerState } = useTimerStore()

  const [actualMinutes, setActualMinutes] = useState(0)

  const task = tasks.find((t) => t.id === taskId)
  const project = task ? projects.find((p) => p.id === task.projectId) : null
  const list = task ? lists.find((l) => l.id === task.listId) : null

  const loadActualMinutes = useCallback(async () => {
    const sessions = await db.sessions.where('taskId').equals(taskId).toArray()
    const total = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
    setActualMinutes(total)
  }, [taskId])

  useEffect(() => {
    loadActualMinutes()
  }, [loadActualMinutes])

  // Refresh when timer becomes idle (session just completed/stopped)
  useEffect(() => {
    if (timerState.status === 'idle') {
      loadActualMinutes()
    }
  }, [timerState.status, loadActualMinutes])

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(task?.title ?? '')
  const [editingEstimate, setEditingEstimate] = useState(false)
  const [estimateInput, setEstimateInput] = useState(
    task?.estimatedMinutes ? formatDuration(task.estimatedMinutes) : '',
  )
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task) {
      setTitleValue(task.title)
      setEstimateInput(task.estimatedMinutes ? formatDuration(task.estimatedMinutes) : '')
    }
  }, [task?.id])

  if (!task || !project) return null

  const isActiveTask = timerState.taskId === taskId && timerState.status !== 'idle'
  const timerRunning = timerState.status !== 'idle'
  const saveTitle = () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== task.title) updateTask(taskId, { title: trimmed })
    else setTitleValue(task.title)
    setEditingTitle(false)
  }

  const saveEstimate = () => {
    const minutes = parseTimeInput(estimateInput) || 0
    updateTask(taskId, { estimatedMinutes: minutes })
    setEditingEstimate(false)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden animate-fade-in">
      {/* Top bar */}
      <div className="border-b px-6 py-4">
        <div className="flex w-full items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => openTask(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ProjectIcon icon={project.icon} fallback="Folder" size="sm" />
          <button
            className="hover:text-foreground hover:underline transition-colors"
            onClick={() => { openTask(null); selectProject(project.id) }}
          >
            {project.name}
          </button>
          {list && (
            <>
              <span>/</span>
              <ProjectIcon icon={list.icon} fallback="List" size="sm" />
              <button
                className="hover:text-foreground hover:underline transition-colors"
                onClick={() => { openTask(null); selectProject(project.id); selectList(list.id) }}
              >
                {list.name}
              </button>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="px-2 py-2">

          {/* Title */}
          <div className="mb-6">
            {editingTitle ? (
              <input
                ref={titleRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle()
                  if (e.key === 'Escape') { setTitleValue(task.title); setEditingTitle(false) }
                }}
                className="w-full bg-transparent text-3xl font-bold outline-none border-b-2 border-primary pb-1"
                autoFocus
              />
            ) : (
              <h1
                className="text-3xl font-bold cursor-text leading-tight hover:text-primary/80 transition-colors"
                onClick={() => setEditingTitle(true)}
                title="Click to edit title"
              >
                {task.title}
              </h1>
            )}
          </div>

          {/* Action row */}
          <div className="mb-6 flex items-center gap-3">
            <Button
              size="sm"
              className={cn('gap-1.5', isActiveTask && 'bg-primary/20 text-primary border border-primary/30')}
              onClick={() => !timerRunning && startWork(taskId, task.estimatedMinutes)}
              disabled={timerRunning && !isActiveTask}
              variant={isActiveTask ? 'outline' : 'default'}
            >
              <Play className="h-3.5 w-3.5" />
              {isActiveTask ? 'Timer running' : timerRunning ? 'Timer busy' : 'Start Pomodoro'}
            </Button>
          </div>

          {/* Metadata grid */}
          <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {/* Status */}
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Layers className="h-3 w-3" /> Status
              </p>
              <Select value={task.statusId} onValueChange={(v) => updateTask(taskId, { statusId: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {project.statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Flag className="h-3 w-3" /> Priority
              </p>
              <Select value={task.priority} onValueChange={(v) => updateTask(taskId, { priority: v as Task['priority'] })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['urgent', 'high', 'medium', 'low'] as const).map((p) => (
                    <SelectItem key={p} value={p}>
                      <Badge variant="outline" className={cn('text-xs', PRIORITY_CONFIG[p].className)}>
                        {PRIORITY_CONFIG[p].label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estimate */}
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" /> Estimate
              </p>
              {editingEstimate ? (
                <input
                  value={estimateInput}
                  onChange={(e) => setEstimateInput(e.target.value)}
                  onBlur={saveEstimate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEstimate()
                    if (e.key === 'Escape') setEditingEstimate(false)
                  }}
                  placeholder="e.g. 2h 30m"
                  className="h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
              ) : (
                <div
                  className="flex h-8 cursor-text items-center rounded-md border bg-background px-2 text-xs hover:border-primary transition-colors"
                  onClick={() => setEditingEstimate(true)}
                >
                  {task.estimatedMinutes > 0
                    ? formatDuration(task.estimatedMinutes)
                    : <span className="text-muted-foreground">Not set</span>}
                </div>
              )}
            </div>

            {/* Actual time */}
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" /> Actual time
              </p>
              <div className={cn(
                'flex h-8 items-center rounded-md border bg-background px-2 text-xs',
                actualMinutes > task.estimatedMinutes && task.estimatedMinutes > 0
                  ? 'text-red-500 border-red-500/30'
                  : actualMinutes > 0
                    ? 'text-emerald-500 border-emerald-500/30'
                    : 'text-muted-foreground',
              )}>
                {actualMinutes > 0 ? formatDuration(actualMinutes) : 'No sessions yet'}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-6 border-t" />

          {/* Notes — rendered markdown, no toolbar, paste images */}
          {/* key=taskId remounts the editor when switching tasks so it never
              receives content updates via props (which caused cursor-reset flicker) */}
          <RichTextEditor
            key={taskId}
            content={task.content ?? ''}
            onChange={(html) => updateTask(taskId, { content: html })}
            placeholder="Write notes, links, acceptance criteria… (## heading, - list, **bold**, paste images)"
          />
          </div>
        </div>
      </div>
    </div>
  )
}
