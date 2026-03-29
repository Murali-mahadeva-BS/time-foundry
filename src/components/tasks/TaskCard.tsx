import { useState } from 'react'
import { Play, MoreHorizontal, Pencil, Trash2, FileText, Clock } from 'lucide-react'
import type { Task, Project } from '@/types'
import { useAppStore } from '@/stores/app.store'
import { useTimerStore } from '@/stores/timer.store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'
import { TaskForm } from './TaskForm'
import { formatDuration } from '@/lib/time'
import { cn } from '@/lib/utils'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', className: 'border-red-500/30 bg-red-500/10 text-red-500' },
  high: { label: 'High', className: 'border-orange-500/30 bg-orange-500/10 text-orange-500' },
  medium: { label: 'Medium', className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  low: { label: 'Low', className: 'border-border bg-muted text-muted-foreground' },
}

interface TaskCardProps {
  task: Task
  project: Project
}

export function TaskCard({ task, project }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const { startWork, state: timerState } = useTimerStore()

  const status = project.statuses.find((s) => s.id === task.statusId)
  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const isActiveTask = timerState.taskId === task.id && timerState.status !== 'idle'

  return (
    <>
      <div
        className={cn(
          'group flex items-start gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm',
          isActiveTask && 'border-primary/50 ring-1 ring-primary/20',
        )}
      >
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-medium leading-snug">{task.title}</p>

          {task.notes && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span className="truncate">{task.notes}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Status */}
            {status && (
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-xs"
                style={{ borderColor: `${status.color}60`, backgroundColor: `${status.color}15`, color: status.color }}
              >
                {status.name}
              </Badge>
            )}

            {/* Priority */}
            <Badge variant="outline" className={cn('h-5 px-1.5 text-xs', priorityConfig.className)}>
              {priorityConfig.label}
            </Badge>

            {/* Estimate */}
            {task.estimatedMinutes > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDuration(task.estimatedMinutes)}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary"
                onClick={() => startWork(task.id)}
                disabled={isActiveTask}
              >
                <Play className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start Pomodoro</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
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
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          <TaskForm
            projectId={task.projectId}
            listId={task.listId}
            task={task}
            onClose={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
