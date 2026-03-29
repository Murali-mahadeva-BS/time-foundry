import { create } from 'zustand'
import type { ProjectFilterState } from '@/types'

export type AppView = 'project' | 'reports' | 'settings'

const DEFAULT_FILTER: ProjectFilterState = {
  statusIds: [],
  sortOrder: 'asc',
}

interface UIStore {
  selectedProjectId: string | null
  selectedListId: string | null
  selectedTaskId: string | null
  selectedView: AppView
  sidebarCollapsed: boolean
  expandedProjectIds: string[]
  filters: Record<string, ProjectFilterState>

  selectProject: (id: string) => void
  selectList: (listId: string | null) => void
  openTask: (taskId: string | null) => void
  selectView: (view: AppView) => void
  toggleSidebar: () => void
  toggleProjectExpanded: (projectId: string) => void
  setFilter: (projectId: string, filter: Partial<ProjectFilterState>) => void
  loadFilters: () => Promise<void>
  saveFilters: () => Promise<void>
}

export const useUIStore = create<UIStore>((set, get) => ({
  selectedProjectId: null,
  selectedListId: null,
  selectedTaskId: null,
  selectedView: 'project',
  sidebarCollapsed: false,
  expandedProjectIds: [],
  filters: {},

  selectProject: (id) =>
    set({ selectedProjectId: id, selectedListId: null, selectedTaskId: null, selectedView: 'project' }),

  selectList: (listId) => set({ selectedListId: listId, selectedTaskId: null }),

  openTask: (taskId) => set({ selectedTaskId: taskId }),

  selectView: (view) => set({ selectedView: view, selectedTaskId: null }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  toggleProjectExpanded: (projectId) =>
    set((s) => ({
      expandedProjectIds: s.expandedProjectIds.includes(projectId)
        ? s.expandedProjectIds.filter((id) => id !== projectId)
        : [...s.expandedProjectIds, projectId],
    })),

  setFilter: (projectId, filter) => {
    const current = get().filters[projectId] ?? DEFAULT_FILTER
    const updated = { ...current, ...filter }
    set((s) => ({ filters: { ...s.filters, [projectId]: updated } }))
    get().saveFilters()
  },

  loadFilters: async () => {
    const result = await chrome.storage.local.get('uiFilters')
    if (result.uiFilters) {
      set({ filters: result.uiFilters as Record<string, ProjectFilterState> })
    }
  },

  saveFilters: async () => {
    await chrome.storage.local.set({ uiFilters: get().filters })
  },
}))
