import { useState } from 'react'
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from 'react-native'
import { useAppStore } from '../../stores/app.store'
import { useUIStore } from '../../stores/ui.store'
import { useSettingsStore } from '../../stores/settings.store'
import { X, ChevronRight, Folder, List, Plus } from 'lucide-react-native'
import { CreateProjectModal } from './CreateProjectModal'

interface ProjectListSheetProps {
  visible: boolean
  onClose: () => void
}

export function ProjectListSheet({ visible, onClose }: ProjectListSheetProps) {
  const [showCreate, setShowCreate] = useState(false)
  const projects = useAppStore((s) => s.projects)
  const lists = useAppStore((s) => s.lists)
  const { selectedProjectId, selectedListId, selectProject, selectList } = useUIStore()
  const primary = useSettingsStore((s) => s.primaryColor)

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Projects</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.closeBtn}>
              <Plus size={20} color={primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          renderItem={({ item: project }) => {
            const projectLists = lists.filter((l) => l.projectId === project.id)
            const isSelected = selectedProjectId === project.id

            return (
              <View>
                <TouchableOpacity
                  style={[styles.projectRow, isSelected && { backgroundColor: `${primary}12` }]}
                  onPress={() => {
                    selectProject(project.id)
                    selectList(null)
                    onClose()
                  }}
                >
                  <Folder size={16} color={isSelected ? primary : '#64748b'} />
                  <Text style={[styles.projectName, isSelected && { color: primary }]}>
                    {project.name}
                  </Text>
                  <ChevronRight size={14} color="#cbd5e1" />
                </TouchableOpacity>

                {isSelected && projectLists.map((list) => {
                  const isListSelected = selectedListId === list.id
                  return (
                    <TouchableOpacity
                      key={list.id}
                      style={[styles.listRow, isListSelected && { backgroundColor: `${primary}18` }]}
                      onPress={() => {
                        selectList(list.id)
                        onClose()
                      }}
                    >
                      <List size={14} color={isListSelected ? primary : '#94a3b8'} />
                      <Text style={[styles.listName, isListSelected && { color: primary }]}>
                        {list.name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No projects yet</Text>
            </View>
          }
        />
      </SafeAreaView>
      <CreateProjectModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
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
  closeBtn: { padding: 4 },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  projectName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#0f172a' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  listName: { fontSize: 14, color: '#475569' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
})
