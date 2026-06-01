import { View, Text, StyleSheet, useWindowDimensions, ScrollView } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import type { Task, PomodoroSession } from '@time-foundry/core'
import { useSettingsStore } from '../../stores/settings.store'
import { formatDuration } from '../../lib/time'

interface EstimateChartProps {
  tasks: Task[]
  sessions: PomodoroSession[]
}

export function EstimateChart({ tasks, sessions }: EstimateChartProps) {
  const { width } = useWindowDimensions()
  const primary = useSettingsStore((s) => s.primaryColor)

  // Top 8 tasks with most sessions
  const taskMinutes: Record<string, number> = {}
  for (const s of sessions) {
    if (s.sessionType === 'work') {
      taskMinutes[s.taskId] = (taskMinutes[s.taskId] ?? 0) + s.durationMinutes
    }
  }

  const top = Object.entries(taskMinutes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([taskId, actual]) => {
      const task = tasks.find((t) => t.id === taskId)
      return { taskId, taskTitle: task?.title ?? 'Unknown', actual, estimated: task?.estimatedMinutes ?? 0 }
    })

  if (top.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Estimate vs Actual</Text>
        <Text style={styles.empty}>No sessions recorded yet</Text>
      </View>
    )
  }

  const barData = top.flatMap(({ taskTitle, actual, estimated }, i) => [
    { value: actual, frontColor: primary, label: taskTitle.slice(0, 8), spacing: 4 },
    { value: estimated, frontColor: '#e2e8f0', spacing: i < top.length - 1 ? 20 : 4 },
  ])

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Estimate vs Actual (minutes)</Text>
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: primary }]} />
        <Text style={styles.legendText}>Actual</Text>
        <View style={[styles.dot, { backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#cbd5e1' }]} />
        <Text style={styles.legendText}>Estimated</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <BarChart
          data={barData}
          barWidth={18}
          spacing={4}
          roundedTop
          hideRules
          hideAxesAndRules={false}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor="#e2e8f0"
          yAxisTextStyle={{ color: '#94a3b8', fontSize: 11 }}
          xAxisLabelTextStyle={{ color: '#64748b', fontSize: 10 }}
          barBorderRadius={3}
          height={160}
          width={Math.max(top.length * 60, width - 72)}
        />
      </ScrollView>
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
    gap: 12,
  },
  title: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#64748b', marginRight: 8 },
  empty: { color: '#94a3b8', fontSize: 14, textAlign: 'center', paddingVertical: 24 },
})
