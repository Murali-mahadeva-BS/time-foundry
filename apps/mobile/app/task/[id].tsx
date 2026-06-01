import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAppStore } from '../../src/stores/app.store'
import { useTimerStore } from '../../src/stores/timer.store'
import { useSettingsStore } from '../../src/stores/settings.store'
import { MarkdownEditor } from '../../src/components/editor/MarkdownEditor'
import { Badge } from '../../src/components/ui/Badge'
import { Button, ButtonText } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { formatDuration, parseTimeInput } from '../../src/lib/time'
import type { Task } from '@time-foundry/core'
import { Play, Trash2, Clock } from 'lucide-react-native'

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
}
const PRIORITIES: Task['priority'][] = ['urgent', 'high', 'medium', 'low']

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const tasks = useAppStore((s) => s.tasks)
  const projects = useAppStore((s) => s.projects)
  const updateTask = useAppStore((s) => s.updateTask)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const getSessionsForTask = useAppStore((s) => s.getSessionsForTask)
  const { state: timerState, startWork } = useTimerStore()
  const primary = useSettingsStore((s) => s.primaryColor)

  const task = tasks.find((t) => t.id === id)
  const project = task ? projects.find((p) => p.id === task.projectId) : null

  const [titleEditing, setTitleEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(task?.title ?? '')
  const [estimateEditing, setEstimateEditing] = useState(false)
  const [estimateValue, setEstimateValue] = useState(
    task?.estimatedMinutes ? formatDuration(task.estimatedMinutes) : '',
  )
  const [actualMinutes, setActualMinutes] = useState(0)

  const loadActual = useCallback(async () => {
    if (!id) return
    const sessions = await getSessionsForTask(id)
    setActualMinutes(sessions.reduce((s, r) => s + r.durationMinutes, 0))
  }, [id, getSessionsForTask])

  useEffect(() => { void loadActual() }, [loadActual])
  useEffect(() => {
    if (timerState.status === 'idle') void loadActual()
  }, [timerState.status])

  useEffect(() => {
    if (task) {
      setTitleValue(task.title)
      setEstimateValue(task.estimatedMinutes ? formatDuration(task.estimatedMinutes) : '')
    }
  }, [task?.id])

  if (!task || !project) return null

  const isActiveTask = timerState.taskId === id && timerState.status !== 'idle'
  const timerRunning = timerState.status !== 'idle'

  function saveTitle() {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== task!.title) void updateTask(id, { title: trimmed })
    else setTitleValue(task!.title)
    setTitleEditing(false)
  }

  function saveEstimate() {
    const minutes = parseTimeInput(estimateValue) || 0
    void updateTask(id, { estimatedMinutes: minutes })
    setEstimateEditing(false)
  }

  function handleDelete() {
    Alert.alert('Delete Task', 'This will permanently delete the task.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          void deleteTask(id).then(() => router.back())
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Title */}
      {titleEditing ? (
        <Input
          value={titleValue}
          onChangeText={setTitleValue}
          onBlur={saveTitle}
          onSubmitEditing={saveTitle}
          autoFocus
          style={{ fontSize: 22, fontWeight: '700' }}
        />
      ) : (
        <TouchableOpacity onPress={() => setTitleEditing(true)}>
          <Text style={styles.titleText}>{task.title}</Text>
        </TouchableOpacity>
      )}

      {/* Start pomodoro */}
      <Button
        variant={isActiveTask ? 'outline' : 'default'}
        onPress={() => { if (!timerRunning) void startWork(id, task.estimatedMinutes) }}
        disabled={timerRunning && !isActiveTask}
        style={{ alignSelf: 'flex-start' }}
      >
        <Play size={14} color={isActiveTask ? primary : '#fff'} style={{ marginRight: 6 }} />
        <ButtonText variant={isActiveTask ? 'outline' : 'default'}>
          {isActiveTask ? 'Timer running' : timerRunning ? 'Timer busy' : 'Start Pomodoro'}
        </ButtonText>
      </Button>

      {/* Metadata */}
      <View style={styles.metaGrid}>
        {/* Status */}
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {project.statuses.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => void updateTask(id, { statusId: s.id })}
                style={[
                  styles.statusChip,
                  task.statusId === s.id && { borderColor: s.color, backgroundColor: `${s.color}18` },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                <Text style={[styles.statusLabel, task.statusId === s.id && { color: s.color, fontWeight: '600' }]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Priority */}
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Priority</Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => void updateTask(id, { priority: p })}
                style={[styles.statusChip, task.priority === p && { borderColor: '#0f172a', backgroundColor: '#0f172a' }]}
              >
                <Text style={[styles.statusLabel, task.priority === p && { color: '#fff', fontWeight: '600' }]}>
                  {PRIORITY_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estimate */}
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Estimate</Text>
          {estimateEditing ? (
            <Input
              value={estimateValue}
              onChangeText={setEstimateValue}
              onBlur={saveEstimate}
              onSubmitEditing={saveEstimate}
              placeholder="e.g. 2h 30m"
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setEstimateEditing(true)} style={styles.timeChip}>
              <Clock size={14} color="#64748b" />
              <Text style={styles.timeText}>
                {task.estimatedMinutes > 0 ? formatDuration(task.estimatedMinutes) : 'Not set'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actual */}
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Actual time</Text>
          <View style={styles.timeChip}>
            <Clock size={14} color={actualMinutes > task.estimatedMinutes && task.estimatedMinutes > 0 ? '#ef4444' : '#22c55e'} />
            <Text style={[styles.timeText, actualMinutes > task.estimatedMinutes && task.estimatedMinutes > 0 && { color: '#ef4444' }]}>
              {actualMinutes > 0 ? formatDuration(Math.round(actualMinutes)) : 'No sessions'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Notes */}
      <Text style={styles.sectionLabel}>Notes</Text>
      <View style={{ minHeight: 280 }}>
        <MarkdownEditor
          value={task.content ?? ''}
          onChange={(text) => void updateTask(id, { content: text })}
        />
      </View>

      {/* Delete */}
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
        <Trash2 size={16} color="#ef4444" />
        <Text style={styles.deleteText}>Delete task</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 20 },
  titleText: { fontSize: 24, fontWeight: '700', color: '#0f172a', lineHeight: 32 },
  metaGrid: { gap: 16 },
  metaCell: { gap: 8 },
  metaLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, color: '#475569' },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  timeText: { fontSize: 13, color: '#475569' },
  divider: { height: 1, backgroundColor: '#e2e8f0' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteText: { fontSize: 14, color: '#ef4444' },
})
