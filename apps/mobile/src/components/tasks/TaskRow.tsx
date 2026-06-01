import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import type { Task, Project } from '@time-foundry/core'
import { Badge } from '../ui/Badge'
import { useTimerStore } from '../../stores/timer.store'
import { useSettingsStore } from '../../stores/settings.store'
import { Play } from 'lucide-react-native'
import { formatDuration } from '../../lib/time'

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

interface TaskRowProps {
  task: Task
  project: Project
}

export function TaskRow({ task, project }: TaskRowProps) {
  const router = useRouter()
  const { state: timerState, startWork } = useTimerStore()
  const primary = useSettingsStore((s) => s.primaryColor)
  const status = project.statuses.find((s) => s.id === task.statusId)
  const isActive = timerState.taskId === task.id && timerState.status !== 'idle'
  const timerRunning = timerState.status !== 'idle'

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/task/${task.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
        <View style={styles.meta}>
          {status && (
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          )}
          {status && <Text style={styles.metaText}>{status.name}</Text>}
          <Text style={styles.sep}>·</Text>
          <Badge label={PRIORITY_LABELS[task.priority]} priority={task.priority} />
          {task.estimatedMinutes > 0 && (
            <>
              <Text style={styles.sep}>·</Text>
              <Text style={styles.metaText}>{formatDuration(task.estimatedMinutes)}</Text>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.playBtn,
          isActive && { backgroundColor: `${primary}22`, borderColor: primary },
        ]}
        disabled={timerRunning && !isActive}
        onPress={(e) => {
          e.stopPropagation()
          if (!timerRunning) void startWork(task.id, task.estimatedMinutes)
        }}
      >
        <Play
          size={14}
          color={isActive ? primary : timerRunning ? '#cbd5e1' : '#64748b'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  main: { flex: 1, gap: 6 },
  title: { fontSize: 15, color: '#0f172a', fontWeight: '500', lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { fontSize: 12, color: '#64748b' },
  sep: { fontSize: 12, color: '#cbd5e1' },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
