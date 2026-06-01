import { FlatList, View, Text, StyleSheet } from 'react-native'
import { useAppStore } from '../../stores/app.store'
import { useUIStore } from '../../stores/ui.store'
import { TaskRow } from './TaskRow'

export function TaskList() {
  const tasks = useAppStore((s) => s.tasks)
  const projects = useAppStore((s) => s.projects)
  const lists = useAppStore((s) => s.lists)
  const { selectedProjectId, selectedListId } = useUIStore()

  const project = projects.find((p) => p.id === selectedProjectId)

  const filtered = tasks.filter((t) => {
    if (!selectedProjectId) return false
    if (t.projectId !== selectedProjectId) return false
    if (selectedListId && t.listId !== selectedListId) return false
    return true
  })

  if (!selectedProjectId || !project) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No project selected</Text>
        <Text style={styles.emptyHint}>Tap the project name above to choose one</Text>
      </View>
    )
  }

  const listName = selectedListId
    ? lists.find((l) => l.id === selectedListId)?.name
    : null

  return (
    <FlatList
      data={filtered}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => <TaskRow task={item} project={project} />}
      ListHeaderComponent={
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionText}>
            {listName ?? 'All tasks'} · {filtered.length}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No tasks yet</Text>
          <Text style={styles.emptyHint}>Tap + to add a task</Text>
        </View>
      }
      contentContainerStyle={{ flexGrow: 1 }}
    />
  )
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionText: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  emptyHint: { fontSize: 13, color: '#94a3b8' },
})
