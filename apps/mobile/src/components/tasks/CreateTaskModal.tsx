import { useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useAppStore } from '../../stores/app.store'
import { useUIStore } from '../../stores/ui.store'
import { Input } from '../ui/Input'
import { Button, ButtonText } from '../ui/Button'
import { X } from 'lucide-react-native'
import { parseTimeInput } from '../../lib/time'
import type { Task } from '@time-foundry/core'

const PRIORITIES: Task['priority'][] = ['urgent', 'high', 'medium', 'low']
const PRIORITY_LABELS: Record<Task['priority'], string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
}

interface CreateTaskModalProps {
  visible: boolean
  onClose: () => void
}

export function CreateTaskModal({ visible, onClose }: CreateTaskModalProps) {
  const createTask = useAppStore((s) => s.createTask)
  const projects = useAppStore((s) => s.projects)
  const lists = useAppStore((s) => s.lists)
  const { selectedProjectId, selectedListId } = useUIStore()

  const [title, setTitle] = useState('')
  const [estimate, setEstimate] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const project = projects.find((p) => p.id === selectedProjectId)
  const defaultStatusId = project?.statuses[0]?.id ?? ''

  const targetListId = selectedListId ?? lists.find((l) => l.projectId === selectedProjectId)?.id

  async function handleCreate() {
    if (!title.trim()) { setError('Title is required'); return }
    if (!selectedProjectId || !targetListId) { setError('Select a project and list first'); return }
    setLoading(true)
    setError('')
    try {
      await createTask({
        projectId: selectedProjectId,
        listId: targetListId,
        title: title.trim(),
        estimatedMinutes: parseTimeInput(estimate),
        priority,
        statusId: defaultStatusId,
      })
      setTitle('')
      setEstimate('')
      setPriority('medium')
      onClose()
    } catch {
      setError('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.title}>New Task</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color="#64748b" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            <Input
              label="Title"
              placeholder="What needs to be done?"
              value={title}
              onChangeText={setTitle}
              autoFocus
              error={error}
            />
            <Input
              label="Estimate (optional)"
              placeholder="e.g. 2h 30m"
              value={estimate}
              onChangeText={setEstimate}
            />
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748b' }}>Priority</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.priorityChip,
                      priority === p && styles.priorityChipActive,
                    ]}
                  >
                    <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>
                      {PRIORITY_LABELS[p]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>
              <ButtonText variant="outline">Cancel</ButtonText>
            </Button>
            <Button onPress={() => void handleCreate()} loading={loading} style={{ flex: 1 }}>
              <ButtonText>Create Task</ButtonText>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#0f172a' },
  body: { padding: 16, gap: 20 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  priorityChipActive: { borderColor: '#0f172a', backgroundColor: '#0f172a' },
  priorityText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  priorityTextActive: { color: '#ffffff' },
})
