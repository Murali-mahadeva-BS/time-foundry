import { useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native'
import { useAppStore } from '../../stores/app.store'
import { useUIStore } from '../../stores/ui.store'
import { Input } from '../ui/Input'
import { Button, ButtonText } from '../ui/Button'
import { X } from 'lucide-react-native'

interface CreateProjectModalProps {
  visible: boolean
  onClose: () => void
}

export function CreateProjectModal({ visible, onClose }: CreateProjectModalProps) {
  const createProject = useAppStore((s) => s.createProject)
  const selectProject = useUIStore((s) => s.selectProject)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Project name is required'); return }
    setLoading(true)
    setError('')
    try {
      const project = await createProject(name.trim(), description.trim() || undefined)
      selectProject(project.id)
      setName('')
      setDescription('')
      onClose()
    } catch {
      setError('Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.title}>New Project</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color="#64748b" /></TouchableOpacity>
          </View>
          <View style={styles.body}>
            <Input label="Name" placeholder="My Project" value={name} onChangeText={setName} autoFocus error={error} />
            <Input label="Description (optional)" placeholder="What is this project about?" value={description} onChangeText={setDescription} multiline />
          </View>
          <View style={styles.footer}>
            <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>
              <ButtonText variant="outline">Cancel</ButtonText>
            </Button>
            <Button onPress={() => void handleCreate()} loading={loading} style={{ flex: 1 }}>
              <ButtonText>Create</ButtonText>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 17, fontWeight: '600', color: '#0f172a' },
  body: { padding: 16, gap: 20, flex: 1 },
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
})
