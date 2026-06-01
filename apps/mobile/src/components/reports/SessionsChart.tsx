import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import type { PomodoroSession } from '@time-foundry/core'
import { useSettingsStore } from '../../stores/settings.store'

interface SessionsChartProps {
  sessions: PomodoroSession[]
}

export function SessionsChart({ sessions }: SessionsChartProps) {
  const { width } = useWindowDimensions()
  const primary = useSettingsStore((s) => s.primaryColor)

  // Build last 7 days
  const days: { label: string; date: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    days.push({
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      date: d.getTime(),
    })
  }

  const data = days.map(({ label, date }) => {
    const dayEnd = date + 86400000
    const count = sessions.filter(
      (s) => s.sessionType === 'work' && s.startedAt >= date && s.startedAt < dayEnd,
    ).length
    return { value: count, label, frontColor: primary }
  })

  const maxVal = Math.max(...data.map((d) => d.value), 1)

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Work sessions — last 7 days</Text>
      <BarChart
        data={data}
        barWidth={28}
        spacing={14}
        roundedTop
        hideRules
        hideAxesAndRules={false}
        yAxisLabelWidth={24}
        maxValue={maxVal + 1}
        noOfSections={Math.min(maxVal + 1, 6)}
        xAxisThickness={1}
        yAxisThickness={0}
        xAxisColor="#e2e8f0"
        yAxisTextStyle={{ color: '#94a3b8', fontSize: 11 }}
        xAxisLabelTextStyle={{ color: '#64748b', fontSize: 11 }}
        barBorderRadius={4}
        width={width - 72}
        height={160}
      />
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
})
