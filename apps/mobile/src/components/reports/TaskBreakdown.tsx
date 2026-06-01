import { View, Text, StyleSheet, FlatList } from 'react-native'
import type { Task, PomodoroSession } from '@time-foundry/core'
import { useSettingsStore } from '../../stores/settings.store'
import { formatDuration } from '../../lib/time'

interface TaskBreakdownProps {
  tasks: Task[]
  sessions: PomodoroSession[]
}

export function TaskBreakdown({ tasks, sessions }: TaskBreakdownProps) {
  const primary = useSettingsStore((s) => s.primaryColor)

  const taskMinutes: Record<string, number> = {}
  const taskCount: Record<string, number> = {}
  for (const s of sessions) {
    if (s.sessionType === 'work') {
      taskMinutes[s.taskId] = (taskMinutes[s.taskId] ?? 0) + s.durationMinutes
      taskCount[s.taskId] = (taskCount[s.taskId] ?? 0) + 1
    }
  }

  const entries = Object.entries(taskMinutes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([taskId, minutes]) => ({
      taskId,
      title: tasks.find((t) => t.id === taskId)?.title ?? 'Unknown task',
      minutes,
      count: taskCount[taskId] ?? 0,
    }))

  const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0)

  if (entries.length === 0) return null

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Task breakdown</Text>
      {entries.map((entry) => {
        const pct = totalMinutes > 0 ? entry.minutes / totalMinutes : 0
        return (
          <View key={entry.taskId} style={styles.row}>
            <Text style={styles.taskTitle} numberOfLines={1}>{entry.title}</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: primary }]} />
            </View>
            <View style={styles.stats}>
              <Text style={styles.stat}>{formatDuration(entry.minutes)}</Text>
              <Text style={styles.statSep}>·</Text>
              <Text style={styles.stat}>{entry.count} 🍅</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 14,
  },
  title: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  row: { gap: 4 },
  taskTitle: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  barBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  stat: { fontSize: 12, color: '#64748b' },
  statSep: { fontSize: 12, color: '#cbd5e1' },
})
