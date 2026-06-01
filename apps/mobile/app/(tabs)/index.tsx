import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAppStore } from '../../src/stores/app.store'
import { useUIStore } from '../../src/stores/ui.store'
import { useSettingsStore } from '../../src/stores/settings.store'
import { TaskList } from '../../src/components/tasks/TaskList'
import { ProjectListSheet } from '../../src/components/projects/ProjectListSheet'
import { CreateTaskModal } from '../../src/components/tasks/CreateTaskModal'
import { ChevronDown, Plus } from 'lucide-react-native'

export default function TasksScreen() {
  const [showProjects, setShowProjects] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const projects = useAppStore((s) => s.projects)
  const lists = useAppStore((s) => s.lists)
  const { selectedProjectId, selectedListId } = useUIStore()
  const primary = useSettingsStore((s) => s.primaryColor)

  const project = projects.find((p) => p.id === selectedProjectId)
  const list = selectedListId ? lists.find((l) => l.id === selectedListId) : null

  const headerLabel = project
    ? list ? `${project.name} / ${list.name}` : project.name
    : 'Select a project'

  return (
    <View style={styles.container}>
      {/* Project / list picker */}
      <TouchableOpacity style={styles.projectHeader} onPress={() => setShowProjects(true)}>
        <Text style={[styles.projectLabel, !project && { color: '#94a3b8' }]} numberOfLines={1}>
          {headerLabel}
        </Text>
        <ChevronDown size={16} color={primary} />
      </TouchableOpacity>

      <TaskList />

      {/* FAB */}
      {selectedProjectId && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: primary }]}
          onPress={() => setShowCreateTask(true)}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      )}

      <ProjectListSheet visible={showProjects} onClose={() => setShowProjects(false)} />
      <CreateTaskModal visible={showCreateTask} onClose={() => setShowCreateTask(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  projectLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0f172a' },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
})
