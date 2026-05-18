import { useState } from 'react'
import { ListPlus } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useUIStore } from '../../stores/ui.store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { IconPicker } from '../ui/icon-picker'
import { ProjectIcon } from '../ui/project-icon'

interface NewListDialogProps {
  projectId: string
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NewListDialog({ projectId, children, open: controlledOpen, onOpenChange }: NewListDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('List')
  const createList = useAppStore((s) => s.createList)
  const selectList = useUIStore((s) => s.selectList)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const list = await createList(projectId, name.trim(), icon)
    selectList(list.id)
    setOpen(false)
    setName('')
    setIcon('List')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      {!children && controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <ListPlus className="h-4 w-4" />
            New List
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create list</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="list-name">Name</Label>
            <div className="flex gap-2">
              <IconPicker value={icon} onChange={setIcon}>
                <Button type="button" variant="outline" size="icon" className="shrink-0">
                  <ProjectIcon icon={icon} fallback="List" />
                </Button>
              </IconPicker>
              <Input
                id="list-name"
                placeholder="e.g. Backlog, Sprint 1, In Review"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
