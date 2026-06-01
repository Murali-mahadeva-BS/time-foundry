import { useEffect, useState } from 'react'
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native'
import { useAppStore } from '../../src/stores/app.store'
import { SessionsChart } from '../../src/components/reports/SessionsChart'
import { EstimateChart } from '../../src/components/reports/EstimateChart'
import { TaskBreakdown } from '../../src/components/reports/TaskBreakdown'
import type { PomodoroSession } from '@time-foundry/core'

export default function ReportsScreen() {
  const tasks = useAppStore((s) => s.tasks)
  const getAllSessions = useAppStore((s) => s.getAllSessions)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const all = await getAllSessions()
    setSessions(all)
  }

  useEffect(() => { void load() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const totalWork = sessions.filter((s) => s.sessionType === 'work').length
  const totalMinutes = sessions
    .filter((s) => s.sessionType === 'work')
    .reduce((sum, s) => sum + s.durationMinutes, 0)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalWork}</Text>
          <Text style={styles.summaryLabel}>Pomodoros</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{Math.round(totalMinutes / 60 * 10) / 10}h</Text>
          <Text style={styles.summaryLabel}>Total time</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{tasks.length}</Text>
          <Text style={styles.summaryLabel}>Tasks</Text>
        </View>
      </View>

      <SessionsChart sessions={sessions} />
      <EstimateChart tasks={tasks} sessions={sessions} />
      <TaskBreakdown tasks={tasks} sessions={sessions} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 16 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 4,
  },
  summaryValue: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  summaryLabel: { fontSize: 12, color: '#64748b' },
})
