import { useState, useEffect, useRef } from 'react'
import { X, Play, Clock, Flag, AlignLeft, Layers } from 'lucide-react'
import type { Task, Project } from '@time-foundry/core'
import { useAppStore } from '../../stores/app.store'
import { useTimerStore } from '@ui/stores/timer.store'
import { RichTextEditor } from '../editor/RichTextEditor'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { formatDuration, parseTimeInput } from '../../lib/time'
import { cn } from '../../lib/utils'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', className: 'border-red-500/30 bg-red-500/10 text-red-500' },
  high: { label: 'High', className: 'border-orange-500/30 bg-orange-500/10 text-orange-500' },
  medium: { label: 'Medium', className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  low: { label: 'Low', className: 'border-border bg-muted text-muted-foreground' },
}

interface TaskDetailPanelProps {
  task: Task
  project: Project
  onClose: () => void
}

export function TaskDetailPanel({ task, project, onClose }: TaskDetailPanelProps) {
  const updateTask = useAppStore((s) => s.updateTask)
  const { startWork, state: timerState } = useTimerStore()

  const [title, setTitle] = useState(task.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingEstimate, setEditingEstimate] = useState(false)
  const [estimateInput, setEstimateInput] = useState(
    task.estimatedMinutes ? formatDuration(task.estimatedMinutes) : '',
  )
  const titleRef = useRef<HTMLInputElement>(null)
  const estimateRef = useRef<HTMLInputElement>(null)

  // Sync when switching tasks
  useEffect(() => {
    setTitle(task.title)
    setEstimateInput(task.estimatedMinutes ? formatDuration(task.estimatedMinutes) : '')
    setEditingTitle(false)
    setEditingEstimate(false)
  }, [task.id])

  const isActiveTask = timerState.taskId === task.id && timerState.status !== 'idle'
  const timerRunning = timerState.status !== 'idle'
  const status = project.statuses.find((s) => s.id === task.statusId)

  const saveTitle = () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== task.title) {
      updateTask(task.id, { title: trimmed })
    } else {
      setTitle(task.title)
    }
    setEditingTitle(false)
  }

  const saveEstimate = () => {
    const minutes = parseTimeInput(estimateInput) || 0
    if (minutes !== task.estimatedMinutes) {
      updateTask(task.id, { estimatedMinutes: minutes })
    }
    setEditingEstimate(false)
  }

  return (
    <div className="flex h-full flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Task Detail</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Title */}
        <div>
          {editingTitle ? (
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle()
                if (e.key === 'Escape') { setTitle(task.title); setEditingTitle(false) }
              }}
              className="w-full bg-transparent text-lg font-semibold outline-none border-b border-primary pb-0.5"
              autoFocus
            />
          ) : (
            <h2
              className="text-lg font-semibold leading-snug cursor-text hover:text-primary transition-colors"
              onClick={() => setEditingTitle(true)}
            >
              {task.title}
            </h2>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className={cn(
              'gap-1.5 transition-all',
              isActiveTask && 'bg-primary/20 text-primary border border-primary/30',
            )}
            onClick={() => !timerRunning && startWork(task.id, task.estimatedMinutes)}
            disabled={timerRunning && !isActiveTask}
            variant={isActiveTask ? 'outline' : 'default'}
          >
            <Play className="h-3.5 w-3.5" />
            {isActiveTask ? 'Timer running' : timerRunning ? 'Timer busy' : 'Start Pomodoro'}
          </Button>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Status */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3" /> Status
            </p>
            <Select
              value={task.statusId}
              onValueChange={(v) => updateTask(task.id, { statusId: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {project.statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Flag className="h-3 w-3" /> Priority
            </p>
            <Select
              value={task.priority}
              onValueChange={(v) => updateTask(task.id, { priority: v as Task['priority'] })}
            >
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
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Estimate
            </p>
            {editingEstimate ? (
              <input
                ref={estimateRef}
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
                className="flex h-8 cursor-text items-center rounded-md border bg-background px-2 text-xs text-foreground hover:border-primary transition-colors"
                onClick={() => setEditingEstimate(true)}
              >
                {task.estimatedMinutes > 0
                  ? formatDuration(task.estimatedMinutes)
                  : <span className="text-muted-foreground">Not set</span>}
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current status</p>
            <div className="flex h-8 items-center">
              {status && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: `${status.color}60`, backgroundColor: `${status.color}15`, color: status.color }}
                >
                  {status.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Notes / rich text */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlignLeft className="h-3 w-3" /> Notes
          </p>
          <RichTextEditor
            content={task.content ?? ''}
            onChange={(html) => updateTask(task.id, { content: html })}
          />
        </div>
      </div>
    </div>
  )
}
