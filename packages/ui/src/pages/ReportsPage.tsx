import { useEffect, useState } from 'react'
import { BarChart3, Clock, Target, Flame, TrendingUp, Info } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'
import { db } from '@time-foundry/core'
import type { PomodoroSession } from '@time-foundry/core'
import { getDayBounds, getWeekBounds, getMonthBounds, formatDuration } from '../lib/time'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { cn } from '../lib/utils'
import { useAppStore } from '../stores/app.store'

type Range = 'day' | 'week' | 'month'

interface TaskStat {
  taskId: string
  title: string
  estimatedMinutes: number
  actualMinutes: number
  sessions: number
}

interface HourStat {
  hour: number
  minutes: number
}

function useSessions(range: Range) {
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  useEffect(() => {
    const now = new Date()
    const bounds =
      range === 'day'
        ? getDayBounds(now)
        : range === 'week'
          ? getWeekBounds(now)
          : getMonthBounds(now)

    db.sessions
      .where('startedAt')
      .between(bounds.start, bounds.end)
      .toArray()
      .then(setSessions)
  }, [range])
  return sessions
}

// Custom tooltip for recharts
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatDuration(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function ReportsPage() {
  const [range, setRange] = useState<Range>('day')
  const sessions = useSessions(range)
  const tasks = useAppStore((s) => s.tasks)

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const completedSessions = sessions.filter((s) => s.completed).length

  const allSessions = sessions.slice().sort((a, b) => a.startedAt - b.startedAt)
  let maxStreak = 0, curStreak = 0
  for (const s of allSessions) {
    if (s.completed && s.sessionType === 'work') { curStreak++; maxStreak = Math.max(maxStreak, curStreak) }
    else if (s.sessionType === 'work') curStreak = 0
  }

  // Per-task stats
  const taskStats: TaskStat[] = []
  const grouped = sessions.reduce<Record<string, PomodoroSession[]>>((acc, s) => {
    if (!acc[s.taskId]) acc[s.taskId] = []
    acc[s.taskId].push(s)
    return acc
  }, {})
  for (const [taskId, taskSessions] of Object.entries(grouped)) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) continue
    taskStats.push({
      taskId,
      title: task.title,
      estimatedMinutes: task.estimatedMinutes,
      actualMinutes: taskSessions.reduce((sum, s) => sum + s.durationMinutes, 0),
      sessions: taskSessions.length,
    })
  }
  taskStats.sort((a, b) => b.actualMinutes - a.actualMinutes)

  // Productive hours
  const hourStats: HourStat[] = Array.from({ length: 24 }, (_, i) => ({ hour: i, minutes: 0 }))
  for (const s of sessions) {
    const hour = new Date(s.startedAt).getHours()
    hourStats[hour].minutes += s.durationMinutes
  }
  const maxHourMinutes = Math.max(...hourStats.map((h) => h.minutes), 1)

  // Horizontal bar chart data (top 8 tasks, truncated labels for Y axis)
  const barData = taskStats.slice(0, 8).map((t) => ({
    name: t.title.length > 24 ? t.title.slice(0, 24) + '…' : t.title,
    fullName: t.title,
    Estimate: t.estimatedMinutes,
    Actual: t.actualMinutes,
  }))

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-base font-semibold">Reports</h1>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-6">

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Total focus time
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-bold text-primary">{formatDuration(totalMinutes)}</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Target className="h-3.5 w-3.5 text-emerald-500" /> Sessions completed
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-bold text-emerald-500">{completedSessions}</p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Flame className="h-3.5 w-3.5 text-orange-500" /> Best streak
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-bold text-orange-500">{maxStreak}</p>
                <p className="text-xs text-muted-foreground">consecutive pomodoros</p>
              </CardContent>
            </Card>
          </div>

          {/* Estimate vs Actual — horizontal bar chart */}
          {taskStats.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Time per task — Estimate vs Actual
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Horizontal bars show estimated (grey) and actual (blue) time per task.
                      Red actual bars mean you went over estimate.
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(180, barData.length * 44)}>
                  <BarChart
                    layout="vertical"
                    data={barData}
                    margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
                    barGap={4}
                    barSize={12}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => `${v}m`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: 'hsl(var(--accent))' }}
                    />
                    <Bar dataKey="Estimate" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[0, 3, 3, 0]} />
                    <Bar dataKey="Actual" radius={[0, 3, 3, 0]}>
                      {barData.map((_entry, i) => {
                        const stat = taskStats[i]
                        const over = stat && stat.estimatedMinutes > 0 && stat.actualMinutes > stat.estimatedMinutes
                        return <Cell key={i} fill={over ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-4 rounded-sm bg-muted-foreground/40" /> Estimate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-4 rounded-sm bg-primary" /> Actual (on track)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-4 rounded-sm bg-destructive" /> Actual (over estimate)
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Productive hours heatmap */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-violet-500" />
                Productive hours
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    Each bar represents one hour of the day. Taller = more focus time in that hour.
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1">
                {hourStats.map((h) => (
                  <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-full rounded-sm transition-all',
                        h.minutes > 0 ? 'bg-violet-500' : 'bg-muted',
                      )}
                      style={{ height: `${Math.max(4, (h.minutes / maxHourMinutes) * 64)}px` }}
                      title={`${h.hour}:00 — ${formatDuration(h.minutes)}`}
                    />
                    {h.hour % 4 === 0 && (
                      <span className="text-[9px] text-muted-foreground">{h.hour}h</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Per-task table */}
          {taskStats.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Task breakdown
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Δ = actual minus estimate. Green = under, red = over.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Task</th>
                      <th className="w-16 px-4 py-2 text-right font-medium">Sessions</th>
                      <th className="w-20 px-4 py-2 text-right font-medium">Estimate</th>
                      <th className="w-20 px-4 py-2 text-right font-medium">Actual</th>
                      <th className="w-20 px-4 py-2 text-right font-medium">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskStats.map((t) => {
                      const delta = t.actualMinutes - t.estimatedMinutes
                      return (
                        <tr key={t.taskId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="max-w-0 px-4 py-2">
                            <span className="block truncate font-medium" title={t.title}>{t.title}</span>
                          </td>
                          <td className="px-4 py-2 text-right text-muted-foreground">{t.sessions}</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">
                            {t.estimatedMinutes > 0 ? formatDuration(t.estimatedMinutes) : '—'}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">{formatDuration(t.actualMinutes)}</td>
                          <td className={cn(
                            'px-4 py-2 text-right font-medium',
                            delta > 0 ? 'text-red-500' : delta < 0 ? 'text-emerald-500' : 'text-muted-foreground',
                          )}>
                            {t.estimatedMinutes > 0
                              ? `${delta > 0 ? '+' : ''}${formatDuration(Math.abs(delta))}`
                              : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart3 className="mb-3 h-12 w-12 text-muted-foreground/20" />
              <p className="font-medium">No sessions recorded</p>
              <p className="text-sm text-muted-foreground">
                Start a Pomodoro and complete or stop it to see stats here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
