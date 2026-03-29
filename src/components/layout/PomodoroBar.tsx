import { Pause, Play, Square, SkipForward, Plus } from 'lucide-react'
import { useTimerStore } from '@/stores/timer.store'
import { useAppStore } from '@/stores/app.store'
import { useSettingsStore } from '@/stores/settings.store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatSeconds } from '@/lib/time'
import { cn } from '@/lib/utils'

const SESSION_LABELS = {
  work: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}

const SESSION_CONFIG = {
  work: {
    label: 'Focus',
    color: 'text-primary',
    bg: 'bg-primary/5 border-primary/20',
    bar: 'bg-primary',
    icon: '⚡',
  },
  shortBreak: {
    label: 'Short Break',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/5 border-emerald-500/20',
    bar: 'bg-emerald-500',
    icon: '☕',
  },
  longBreak: {
    label: 'Long Break',
    color: 'text-violet-500',
    bg: 'bg-violet-500/5 border-violet-500/20',
    bar: 'bg-violet-500',
    icon: '🌿',
  },
}

export function PomodoroBar() {
  const { state, remainingSeconds, pause, resume, stop, skip, extend } = useTimerStore()
  const tasks = useAppStore((s) => s.tasks)
  const settings = useSettingsStore((s) => s.settings)

  if (state.status === 'idle') return null

  const task = tasks.find((t) => t.id === state.taskId)
  const config = SESSION_CONFIG[state.sessionType]
  const totalSeconds =
    state.sessionType === 'work'
      ? settings.workDuration * 60
      : state.sessionType === 'shortBreak'
        ? settings.shortBreakDuration * 60
        : settings.longBreakDuration * 60

  const progress = Math.min(100, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100))
  const isRunning = state.status === 'running' || state.status === 'break'
  const isPaused = state.status === 'paused'

  return (
    <div className={cn('border-t px-4 py-2.5 transition-colors duration-500', config.bg)}>
      {/* Progress bar at top */}
      <div className="relative mb-2 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', config.bar)}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Session type + task name */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-lg shrink-0">{config.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-semibold uppercase tracking-wide', config.color)}>
                {SESSION_LABELS[state.sessionType]}
              </span>
              {state.sessionsCompleted > 0 && (
                <span className="text-xs text-muted-foreground">
                  · {state.sessionsCompleted} done
                </span>
              )}
              {/* Pulsing dot when running */}
              {isRunning && (
                <span className={cn('inline-block h-1.5 w-1.5 animate-pulse rounded-full', config.bar)} />
              )}
              {isPaused && (
                <span className="text-xs text-muted-foreground italic">paused</span>
              )}
            </div>
            {task && (
              <span className="block truncate text-sm font-medium leading-tight">{task.title}</span>
            )}
          </div>
        </div>

        {/* Timer display */}
        <div className="flex items-center gap-3">
          <span className={cn(
            'font-mono text-2xl font-bold tabular-nums transition-colors',
            isPaused ? 'text-muted-foreground' : config.color,
          )}>
            {formatSeconds(remainingSeconds)}
          </span>

          {/* Controls */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-8 w-8', isRunning && config.color)}
                  onClick={isRunning ? pause : resume}
                >
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isRunning ? 'Pause' : 'Resume'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => extend(5)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>+5 min</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={skip}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Skip session</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={stop}>
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
