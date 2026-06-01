import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ProjectFilterState } from '@time-foundry/core'

const FILTER_KEY = 'tf_uiFilters'
const DEFAULT_FILTER: ProjectFilterState = { statusIds: [], sortOrder: 'asc' }

interface UIStore {
  selectedProjectId: string | null
  selectedListId: string | null
  filters: Record<string, ProjectFilterState>

  selectProject: (id: string) => void
  selectList: (listId: string | null) => void
  setFilter: (projectId: string, filter: Partial<ProjectFilterState>) => void
  loadFilters: () => Promise<void>
}

export const useUIStore = create<UIStore>((set, get) => ({
  selectedProjectId: null,
  selectedListId: null,
  filters: {},

  selectProject: (id) => set({ selectedProjectId: id, selectedListId: null }),

  selectList: (listId) => set({ selectedListId: listId }),

  setFilter: (projectId, filter) => {
    const current = get().filters[projectId] ?? DEFAULT_FILTER
    const updated = { ...current, ...filter }
    const filters = { ...get().filters, [projectId]: updated }
    set({ filters })
    void AsyncStorage.setItem(FILTER_KEY, JSON.stringify(filters))
  },

  loadFilters: async () => {
    try {
      const raw = await AsyncStorage.getItem(FILTER_KEY)
      if (raw) set({ filters: JSON.parse(raw) as Record<string, ProjectFilterState> })
    } catch {}
  },
}))
