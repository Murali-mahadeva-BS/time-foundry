import { useState } from 'react'
import { FolderPlus } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { IconPicker } from '../ui/icon-picker'
import { ProjectIcon } from '../ui/project-icon'

interface NewProjectDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NewProjectDialog({ children, open: controlledOpen, onOpenChange }: NewProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('Folder')
  const [importFrom, setImportFrom] = useState<string>('none')

  const projects = useAppStore((s) => s.projects)
  const createProject = useAppStore((s) => s.createProject)
  const selectProject = useUIStore((s) => s.selectProject)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const project = await createProject(
      name.trim(),
      description.trim() || undefined,
      importFrom !== 'none' ? importFrom : undefined,
      icon,
    )
    selectProject(project.id)
    setOpen(false)
    setName('')
    setDescription('')
    setIcon('Folder')
    setImportFrom('none')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      {!children && controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button size="sm">
            <FolderPlus className="h-4 w-4" />
            New Project
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name</Label>
            <div className="flex gap-2">
              <IconPicker value={icon} onChange={setIcon}>
                <Button type="button" variant="outline" size="icon" className="shrink-0">
                  <ProjectIcon icon={icon} fallback="Folder" />
                </Button>
              </IconPicker>
              <Input
                id="project-name"
                placeholder="My project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-desc">Description (optional)</Label>
            <Input
              id="project-desc"
              placeholder="What's this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {projects.length > 0 && (
            <div className="space-y-1.5">
              <Label>Import statuses from</Label>
              <Select value={importFrom} onValueChange={setImportFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Use default statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default (Todo → In Progress → Done)</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
