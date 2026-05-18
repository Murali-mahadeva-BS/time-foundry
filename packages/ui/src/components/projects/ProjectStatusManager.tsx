import { useState, useCallback } from 'react'
import { Plus, GripVertical, Trash2, Check } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import type { Status, Project } from '@time-foundry/core'
import { generateId } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { cn } from '../../lib/utils'

const PRESET_COLORS = [
  '#94a3b8', '#3b82f6', '#22c55e', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

interface ProjectStatusManagerProps {
  project: Project
  children: React.ReactNode
}

export function ProjectStatusManager({ project, children }: ProjectStatusManagerProps) {
  const [open, setOpen] = useState(false)
  const [statuses, setStatuses] = useState<Status[]>(project.statuses)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const updateProjectStatuses = useAppStore((s) => s.updateProjectStatuses)

  const handleAdd = () => {
    if (!newName.trim()) return
    setStatuses((prev) => [
      ...prev,
      { id: generateId(), name: newName.trim(), color: newColor, order: prev.length },
    ])
    setNewName('')
  }

  const handleDelete = (id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id))
  }

  const handleNameChange = (id: string, name: string) => {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  }

  const handleSave = async () => {
    const reordered = statuses.map((s, i) => ({ ...s, order: i }))
    await updateProjectStatuses(project.id, reordered)
    setOpen(false)
  }

  const handleDrop = useCallback((targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    setStatuses((prev) => {
      const from = prev.findIndex((s) => s.id === draggedId)
      const to = prev.findIndex((s) => s.id === targetId)
      if (from === -1 || to === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setDraggedId(null)
    setDragOverId(null)
  }, [draggedId])

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setStatuses(project.statuses) }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage statuses — {project.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          {statuses.map((status) => (
            <div
              key={status.id}
              draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedId(status.id) }}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(status.id) }}
              onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
              onDrop={(e) => { e.preventDefault(); handleDrop(status.id) }}
              className={cn(
                'flex items-center gap-2 rounded-md border px-3 py-2 transition-colors',
                dragOverId === status.id && draggedId !== status.id && 'border-t-2 border-t-primary bg-accent/30',
                draggedId === status.id && 'opacity-40',
              )}
            >
              <span className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-4 w-4" />
              </span>

              <div
                className="h-4 w-4 shrink-0 rounded-full border-2 border-white/30 shadow"
                style={{ backgroundColor: status.color }}
              />

              <Input
                value={status.name}
                onChange={(e) => handleNameChange(status.id, e.target.value)}
                className="h-7 flex-1 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
              />

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(status.id)}
                disabled={statuses.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add new status */}
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className="h-4 w-4 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c, outline: newColor === c ? '2px solid white' : undefined }}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
          <Input
            placeholder="New status name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-7 flex-1 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
          />
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
