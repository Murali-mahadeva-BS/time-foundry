import { useState, useRef, useCallback } from 'react'
import { AlarmClock, Hourglass, Play, Trash2, Plus, GripVertical } from 'lucide-react'
import type { Task, Project, TimerMode } from '@time-foundry/core'
import { useAppStore } from '../../stores/app.store'
import { useSettingsStore } from '@ui/stores/settings.store'
import { useTimerStore } from '@ui/stores/timer.store'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '../ui/select'
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
import { parseTimeInput, formatDuration } from '../../lib/time'
import { cn } from '../../lib/utils'

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
  { value: 'low', label: 'Low', color: 'text-slate-400' },
] as const

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-slate-400',
}

interface TaskTableProps {
  tasks: Task[]
  project: Project
  listId: string
  selectedTaskId: string | null
  onSelectTask: (taskId: string) => void
  actualMinutesMap: Record<string, number>
}

export function TaskTable({
  tasks, project, listId, selectedTaskId, onSelectTask, actualMinutesMap,
}: TaskTableProps) {
  const createTask = useAppStore((s) => s.createTask)
  const updateTask = useAppStore((s) => s.updateTask)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const { startWork, state: timerState } = useTimerStore()
  const defaultTimerMode = useSettingsStore((s) => s.settings.defaultTimerMode)

  const [addingTitle, setAddingTitle] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const addInputRef = useRef<HTMLInputElement>(null)

  // Drag & drop state
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const timerRunning = timerState.status !== 'idle'

  const handleAddTask = useCallback(async () => {
    const trimmed = addingTitle.trim()
    if (!trimmed) { setShowAdd(false); return }
    await createTask({
      projectId: project.id,
      listId,
      title: trimmed,
      estimatedMinutes: 0,
      timerMode: defaultTimerMode,
      priority: 'medium',
      statusId: project.statuses[0]?.id ?? '',
    })
    setAddingTitle('')
    setTimeout(() => addInputRef.current?.focus(), 50)
  }, [addingTitle, createTask, defaultTimerMode, listId, project.id, project.statuses])

  const handleDrop = useCallback(async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return

    const draggedIdx = tasks.findIndex((t) => t.id === draggedId)
    const targetIdx = tasks.findIndex((t) => t.id === targetId)
    if (draggedIdx === -1 || targetIdx === -1) return

    // Reorder: build new order array
    const reordered = [...tasks]
    const [moved] = reordered.splice(draggedIdx, 1)
    reordered.splice(targetIdx, 0, moved)

    // Update order values
    await Promise.all(
      reordered.map((t, i) => {
        if (t.order !== i) return updateTask(t.id, { order: i })
        return Promise.resolve()
      }),
    )
    setDraggedId(null)
    setDragOverId(null)
  }, [draggedId, tasks, updateTask])

  return (
    <div className="w-full">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="w-5 py-2 pl-1" />
            <th className="py-2 pl-2 text-left font-medium">Task</th>
            <th className="w-32 py-2 text-left font-medium">Status</th>
            <th className="w-24 py-2 text-left font-medium">Priority</th>
            <th className="w-20 py-2 text-left font-medium">Estimate</th>
            <th className="w-20 py-2 text-left font-medium">Actual</th>
            <th className="w-28 py-2 text-left font-medium">Timer</th>
            <th className="w-16 py-2" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              project={project}
              isSelected={selectedTaskId === task.id}
              isActiveTimer={timerState.taskId === task.id && timerRunning}
              timerRunning={timerRunning}
              isDragOver={dragOverId === task.id}
              isDragging={draggedId === task.id}
              actualMinutes={actualMinutesMap[task.id] ?? 0}
              onSelect={() => onSelectTask(task.id)}
              onUpdate={(data) => updateTask(task.id, data)}
              onDelete={() => deleteTask(task.id)}
              onStartTimer={() => !timerRunning && startWork(task.id, task.estimatedMinutes, task.timerMode)}
              onDragStart={() => setDraggedId(task.id)}
              onDragOver={() => setDragOverId(task.id)}
              onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
              onDrop={() => handleDrop(task.id)}
            />
          ))}
        </tbody>
      </table>

      {/* Add task row */}
      {showAdd && (
        <div className="flex items-center border-b bg-accent/30 px-2 py-1.5">
          <div className="w-5" />
          <input
            ref={addInputRef}
            value={addingTitle}
            onChange={(e) => setAddingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask()
              if (e.key === 'Escape') { setShowAdd(false); setAddingTitle('') }
            }}
            onBlur={() => { if (!addingTitle.trim()) setShowAdd(false) }}
            placeholder="Task title..."
            autoFocus
            className="flex-1 bg-transparent py-1 pl-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="mr-2 flex gap-1">
            <Button size="sm" className="h-7 text-xs" onClick={handleAddTask} disabled={!addingTitle.trim()}>
              Add
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAdd(false); setAddingTitle('') }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={() => { setShowAdd(true); setTimeout(() => addInputRef.current?.focus(), 50) }}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    </div>
  )
}

interface TaskRowProps {
  task: Task
  project: Project
  isSelected: boolean
  isActiveTimer: boolean
  timerRunning: boolean
  isDragOver: boolean
  isDragging: boolean
  actualMinutes: number
  onSelect: () => void
  onUpdate: (data: Partial<Omit<Task, 'id' | 'projectId' | 'listId' | 'createdAt'>>) => void
  onDelete: () => void
  onStartTimer: () => void
  onDragStart: () => void
  onDragOver: () => void
  onDragEnd: () => void
  onDrop: () => void
}

function TaskRow({
  task, project, isSelected, isActiveTimer, timerRunning,
  isDragOver, isDragging, actualMinutes,
  onSelect, onUpdate, onDelete, onStartTimer,
  onDragStart, onDragOver, onDragEnd, onDrop,
}: TaskRowProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(task.title)
  const [editingEstimate, setEditingEstimate] = useState(false)
  const [estimateValue, setEstimateValue] = useState(
    task.estimatedMinutes ? formatDuration(task.estimatedMinutes) : '',
  )

  const saveTitle = () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== task.title) onUpdate({ title: trimmed })
    else setTitleValue(task.title)
    setEditingTitle(false)
  }

  const saveEstimate = () => {
    const minutes = parseTimeInput(estimateValue) || 0
    onUpdate({ estimatedMinutes: minutes })
    setEditingEstimate(false)
  }

  const status = project.statuses.find((s) => s.id === task.statusId)
  const missingFreeEstimate = task.timerMode === 'free' && task.estimatedMinutes <= 0 && !isActiveTimer

  return (
    <tr
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
      onDragOver={(e) => { e.preventDefault(); onDragOver() }}
      onDragEnd={onDragEnd}
      onDrop={(e) => { e.preventDefault(); onDrop() }}
      className={cn(
        'group border-b transition-colors',
        isSelected ? 'bg-primary/5' : 'hover:bg-accent/40',
        isActiveTimer && 'bg-primary/8',
        isDragOver && !isDragging && 'border-t-2 border-t-primary',
        isDragging && 'opacity-40',
      )}
    >
      {/* Drag handle */}
      <td className="w-5 pl-1 text-muted-foreground opacity-0 group-hover:opacity-50">
        <GripVertical className="h-3.5 w-3.5 cursor-grab" />
      </td>

      {/* Title */}
      <td className="py-2 pl-2 pr-4" onClick={onSelect}>
        <div className="flex items-center gap-2">
          {isActiveTimer && (
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          )}
          {editingTitle ? (
            <input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle()
                if (e.key === 'Escape') { setTitleValue(task.title); setEditingTitle(false) }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent outline-none border-b border-primary"
              autoFocus
            />
          ) : (
            <span
              className="flex-1 cursor-pointer truncate leading-snug"
              onDoubleClick={(e) => { e.stopPropagation(); setEditingTitle(true) }}
            >
              {task.title}
            </span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="w-32 py-1.5 pr-2">
        <Select value={task.statusId} onValueChange={(v) => onUpdate({ statusId: v })}>
          <SelectTrigger className="h-7 border-none bg-transparent px-1.5 text-xs shadow-none hover:bg-accent focus:ring-0">
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: status?.color ?? '#94a3b8' }}
              />
              <span className="truncate">{status?.name ?? '—'}</span>
            </div>
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
      </td>

      {/* Priority */}
      <td className="w-24 py-1.5 pr-2">
        <Select value={task.priority} onValueChange={(v) => onUpdate({ priority: v as Task['priority'] })}>
          <SelectTrigger className="h-7 border-none bg-transparent px-1.5 text-xs shadow-none hover:bg-accent focus:ring-0">
            <div className="flex items-center gap-1.5">
              <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[task.priority])} />
              <span className="capitalize">{task.priority}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                <span className={cn('flex items-center gap-1.5', o.color)}>
                  <span className={cn('inline-block h-2 w-2 rounded-full', PRIORITY_DOT[o.value])} />
                  {o.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* Estimate */}
      <td className="w-20 py-2 pr-2">
        {editingEstimate ? (
          <input
            value={estimateValue}
            onChange={(e) => setEstimateValue(e.target.value)}
            onBlur={saveEstimate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEstimate()
              if (e.key === 'Escape') setEditingEstimate(false)
            }}
            placeholder="e.g. 2h"
            className="w-full bg-transparent text-xs outline-none border-b border-primary"
            autoFocus
          />
        ) : (
          <span
            className="cursor-text text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setEditingEstimate(true)}
          >
            {task.estimatedMinutes > 0 ? formatDuration(task.estimatedMinutes) : '—'}
          </span>
        )}
      </td>

      {/* Actual time */}
      <td className="w-20 py-2 pr-2">
        <span className={cn(
          'text-xs',
          actualMinutes > 0
            ? actualMinutes > task.estimatedMinutes && task.estimatedMinutes > 0
              ? 'text-red-500'
              : 'text-emerald-500'
            : 'text-muted-foreground',
        )}>
          {actualMinutes > 0 ? formatDuration(actualMinutes) : '—'}
        </span>
      </td>

      {/* Timer mode */}
      <td className="w-28 py-1.5 pr-2">
        <Select value={task.timerMode} onValueChange={(v) => onUpdate({ timerMode: v as TimerMode })}>
          <SelectTrigger className="h-7 border-none bg-transparent px-1.5 text-xs shadow-none hover:bg-accent focus:ring-0">
            <div className="flex items-center gap-1.5">
              {task.timerMode === 'free' ? <Hourglass className="h-3 w-3" /> : <AlarmClock className="h-3 w-3" />}
              <span>{task.timerMode === 'free' ? 'Free' : 'Pomodoro'}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pomodoro">
              <span className="flex items-center gap-1.5">
                <AlarmClock className="h-3.5 w-3.5" />
                Pomodoro
              </span>
            </SelectItem>
            <SelectItem value="free">
              <span className="flex items-center gap-1.5">
                <Hourglass className="h-3.5 w-3.5" />
                Free timer
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </td>

      {/* Actions */}
      <td className="w-16 py-2 pr-2">
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6',
              isActiveTimer ? 'text-primary' : 'text-muted-foreground hover:text-primary',
              (timerRunning && !isActiveTimer) || missingFreeEstimate ? 'opacity-30' : '',
            )}
            onClick={(e) => { e.stopPropagation(); onStartTimer() }}
            disabled={(timerRunning && !isActiveTimer) || missingFreeEstimate}
          >
            <Play className="h-3 w-3" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{task.title}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  )
}
