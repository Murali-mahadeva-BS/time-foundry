import { useState } from 'react'
import { useAppStore } from '../../stores/app.store'
import { useSettingsStore } from '@ui/stores/settings.store'
import type { Task, Priority, TimerMode } from '@time-foundry/core'
import { parseTimeInput, formatDuration } from '../../lib/time'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { AlarmClock, Hourglass } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

interface TaskFormProps {
  projectId: string
  listId: string
  task?: Task
  onClose: () => void
}

export function TaskForm({ projectId, listId, task, onClose }: TaskFormProps) {
  const projects = useAppStore((s) => s.projects)
  const createTask = useAppStore((s) => s.createTask)
  const updateTask = useAppStore((s) => s.updateTask)
  const defaultTimerMode = useSettingsStore((s) => s.settings.defaultTimerMode)

  const project = projects.find((p) => p.id === projectId)
  const defaultStatusId = project?.statuses[0]?.id ?? ''

  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [estimateInput, setEstimateInput] = useState(
    task ? formatDuration(task.estimatedMinutes) : '',
  )
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [statusId, setStatusId] = useState(task?.statusId ?? defaultStatusId)
  const [timerMode, setTimerMode] = useState<TimerMode>(task?.timerMode ?? defaultTimerMode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const estimatedMinutes = parseTimeInput(estimateInput) || 0

    if (task) {
      await updateTask(task.id, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        estimatedMinutes,
        timerMode,
        priority,
        statusId,
      })
    } else {
      await createTask({
        projectId,
        listId,
        title: title.trim(),
        notes: notes.trim() || undefined,
        estimatedMinutes,
        timerMode,
        priority,
        statusId,
      })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={statusId} onValueChange={setStatusId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {project?.statuses.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-estimate">Estimated time</Label>
        <Input
          id="task-estimate"
          placeholder="e.g. 2h 30m, 45m, 3h"
          value={estimateInput}
          onChange={(e) => setEstimateInput(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Format: 2h 30m · 45m · 3h · or plain minutes (90)
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Timer mode</Label>
        <div className="flex gap-2">
          {([
            { value: 'pomodoro' as TimerMode, label: 'Pomodoro', icon: <AlarmClock className="h-3.5 w-3.5" />, desc: 'Fixed sessions from settings' },
            { value: 'free' as TimerMode, label: 'Free timer', icon: <Hourglass className="h-3.5 w-3.5" />, desc: 'Counts down from estimate' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTimerMode(opt.value)}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-colors',
                timerMode === opt.value
                  ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {opt.icon}
              <div>
                <p className="font-medium">{opt.label}</p>
                <p className="text-[10px]">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {timerMode === 'free' && !parseTimeInput(estimateInput) && (
          <p className="text-xs text-amber-500">Set an estimate above — free timer uses it as the session duration.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-notes">Notes (optional)</Label>
        <Textarea
          id="task-notes"
          placeholder="Additional details, links, acceptance criteria..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!title.trim()}>
          {task ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  )
}
