import { useState } from 'react'
import { useAppStore } from '@/stores/app.store'
import type { Task, Priority } from '@/types'
import { parseTimeInput, formatDuration } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  const project = projects.find((p) => p.id === projectId)
  const defaultStatusId = project?.statuses[0]?.id ?? ''

  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [estimateInput, setEstimateInput] = useState(
    task ? formatDuration(task.estimatedMinutes) : '',
  )
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [statusId, setStatusId] = useState(task?.statusId ?? defaultStatusId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const estimatedMinutes = parseTimeInput(estimateInput) || 0

    if (task) {
      await updateTask(task.id, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        estimatedMinutes,
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
