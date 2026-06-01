import { useEffect, useState } from 'react'
import { Pause, Play, Square, SkipForward, Plus, ArrowRight } from 'lucide-react'
import { useTimerStore } from '@ui/stores/timer.store'
import { useAppStore } from '../../stores/app.store'
import { useSettingsStore } from '@ui/stores/settings.store'
import { useUIStore } from '../../stores/ui.store'
import { db } from '@time-foundry/core'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { formatSeconds, formatDuration } from '../../lib/time'
import { cn } from '../../lib/utils'

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

const NEXT_LABEL: Record<string, string> = {
  work: 'Start Focus',
  shortBreak: 'Start Short Break',
  longBreak: 'Start Long Break',
}

export function TimerBar() {
  const { state, remainingSeconds, pause, resume, stop, skip, extend, startWork, startBreak } = useTimerStore()
  const tasks = useAppStore((s) => s.tasks)
  const settings = useSettingsStore((s) => s.settings)
  const { openTask } = useUIStore()
  const [totalMinutes, setTotalMinutes] = useState(0)

  // Load total actual minutes for the task whenever we land in idle+taskId state
  useEffect(() => {
    if (state.status === 'idle' && state.taskId) {
      db.sessions
        .where('taskId')
        .equals(state.taskId)
        .toArray()
        .then((sessions) => setTotalMinutes(sessions.reduce((sum, s) => sum + s.durationMinutes, 0)))
    }
  }, [state.status, state.taskId])

  const task = tasks.find((t) => t.id === state.taskId)

  // ── Idle+taskId — show the post-session summary panel ────────────────────
  if (state.status === 'idle' && state.taskId && task) {
    const isPomodoro = state.timerMode === 'pomodoro'

    return (
      <div className="border-t bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <span className="text-base shrink-0">{isPomodoro ? '⚡' : '⏱'}</span>

          {/* Task + stats */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isPomodoro ? 'Pomodoro' : 'Free Timer'} · Session ended
              </span>
              {isPomodoro && state.sessionsCompleted > 0 && (
                <span className="text-xs text-muted-foreground">
                  · {state.sessionsCompleted} {state.sessionsCompleted === 1 ? 'session' : 'sessions'} done
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                className="truncate text-sm font-medium leading-tight hover:text-primary transition-colors text-left"
                onClick={() => openTask(task.id)}
              >
                {task.title}
              </button>
              {totalMinutes > 0 && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  Total: {formatDuration(totalMinutes)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {isPomodoro ? (
              <>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    if (state.sessionType === 'work') {
                      startWork(state.taskId!, state.taskEstimatedMinutes, 'pomodoro')
                    } else {
                      startBreak(state.sessionType as 'shortBreak' | 'longBreak')
                    }
                  }}
                >
                  <Play className="h-3 w-3" />
                  {NEXT_LABEL[state.sessionType] ?? 'Start'}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={stop}>
                      <Square className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => openTask(task.id)}
                >
                  <ArrowRight className="h-3 w-3" />
                  Update estimate
                </Button>
                {task.estimatedMinutes > 0 && (
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => startWork(state.taskId!, task.estimatedMinutes, 'free')}
                  >
                    <Play className="h-3 w-3" />
                    Start again
                  </Button>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={stop}>
                      <Square className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Not running and no pending task — hide ────────────────────────────────
  if (state.status === 'idle') return null

  // ── Active timer (running / paused / break) ───────────────────────────────
  const config = SESSION_CONFIG[state.sessionType]
  const isFree = state.timerMode === 'free'

  const totalSeconds = isFree
    ? (state.taskEstimatedMinutes ?? 0) * 60
    : state.sessionType === 'work'
      ? settings.workDuration * 60
      : state.sessionType === 'shortBreak'
        ? settings.shortBreakDuration * 60
        : settings.longBreakDuration * 60

  const progress = totalSeconds > 0
    ? Math.min(100, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100))
    : 0
  const isRunning = state.status === 'running' || state.status === 'break'
  const isPaused = state.status === 'paused'

  return (
    <div className={cn('border-t px-4 py-2.5 transition-colors duration-500', config.bg)}>
      {/* Progress bar */}
      <div className="relative mb-2 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', config.bar)}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Session type + task name */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-lg shrink-0">{isFree ? '⏱' : config.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-semibold uppercase tracking-wide', config.color)}>
                {isFree ? 'Free Timer' : config.label}
              </span>
              {!isFree && state.sessionsCompleted > 0 && (
                <span className="text-xs text-muted-foreground">
                  · {state.sessionsCompleted} done
                </span>
              )}
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

            {!isFree && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={skip}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Skip session</TooltipContent>
              </Tooltip>
            )}

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

// Re-export alias for backward compat with existing imports
export { TimerBar as PomodoroBar }
