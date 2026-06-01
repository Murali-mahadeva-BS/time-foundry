import { create } from 'zustand'
import { db } from '@time-foundry/core'
import { generateId } from '../lib/utils'
import type { Project, List, Task, Status } from '@time-foundry/core'

export const DEFAULT_STATUSES: Omit<Status, 'id'>[] = [
  { name: 'Todo', color: '#94a3b8', order: 0 },
  { name: 'In Progress', color: '#3b82f6', order: 1 },
  { name: 'Done', color: '#22c55e', order: 2 },
]

function makeDefaultStatuses(): Status[] {
  return DEFAULT_STATUSES.map((s) => ({ ...s, id: generateId() }))
}

interface AppStore {
  projects: Project[]
  lists: List[]
  tasks: Task[]

  loadAll: () => Promise<void>

  createProject: (name: string, description?: string, importFromProjectId?: string, icon?: string) => Promise<Project>
  updateProject: (id: string, data: Partial<Pick<Project, 'name' | 'description' | 'statuses' | 'icon'>>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  createList: (projectId: string, name: string, icon?: string) => Promise<List>
  updateList: (id: string, data: Partial<Pick<List, 'name' | 'icon'>>) => Promise<void>
  deleteList: (id: string) => Promise<void>

  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<Task>
  updateTask: (id: string, data: Partial<Omit<Task, 'id' | 'projectId' | 'listId' | 'createdAt'>>) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  updateProjectStatuses: (projectId: string, statuses: Status[]) => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  projects: [],
  lists: [],
  tasks: [],

  loadAll: async () => {
    const [projects, lists, rawTasks] = await Promise.all([
      db.projects.orderBy('createdAt').toArray(),
      db.lists.orderBy('order').toArray(),
      db.tasks.orderBy('createdAt').toArray() as Promise<(Omit<Task, 'timerMode'> & { timerMode?: Task['timerMode'] })[]>,
    ])
    // Normalize tasks from DB — older rows may be missing timerMode
    const tasks: Task[] = rawTasks.map((t) => ({ ...t, timerMode: t.timerMode ?? 'pomodoro' }))
    set({ projects, lists, tasks })
  },

  createProject: async (name, description, importFromProjectId, icon) => {
    let statuses = makeDefaultStatuses()
    if (importFromProjectId) {
      const source = get().projects.find((p) => p.id === importFromProjectId)
      if (source) statuses = source.statuses.map((s) => ({ ...s, id: generateId() }))
    }
    const project: Project = {
      id: generateId(), name, description, icon, statuses,
      createdAt: Date.now(), updatedAt: Date.now(),
    }
    await db.projects.add(project)
    set((s) => ({ projects: [...s.projects, project] }))
    return project
  },

  updateProject: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() }
    await db.projects.update(id, updated)
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...updated } : p)) }))
  },

  deleteProject: async (id) => {
    const listIds = get().lists.filter((l) => l.projectId === id).map((l) => l.id)
    await db.tasks.where('listId').anyOf(listIds).delete()
    await db.lists.where('projectId').equals(id).delete()
    await db.projects.delete(id)
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      lists: s.lists.filter((l) => l.projectId !== id),
      tasks: s.tasks.filter((t) => t.projectId !== id),
    }))
  },

  createList: async (projectId, name, icon) => {
    const order = get().lists.filter((l) => l.projectId === projectId).length
    const list: List = { id: generateId(), projectId, name, icon, order, createdAt: Date.now() }
    await db.lists.add(list)
    set((s) => ({ lists: [...s.lists, list] }))
    return list
  },

  updateList: async (id, data) => {
    await db.lists.update(id, data)
    set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, ...data } : l)) }))
  },

  deleteList: async (id) => {
    await db.tasks.where('listId').equals(id).delete()
    await db.lists.delete(id)
    set((s) => ({
      lists: s.lists.filter((l) => l.id !== id),
      tasks: s.tasks.filter((t) => t.listId !== id),
    }))
  },

  createTask: async (data) => {
    const order = get().tasks.filter((t) => t.listId === data.listId).length
    const task: Task = { ...data, id: generateId(), order, createdAt: Date.now(), updatedAt: Date.now() }
    await db.tasks.add(task)
    set((s) => ({ tasks: [...s.tasks, task] }))
    return task
  },

  updateTask: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() }
    await db.tasks.update(id, updated)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)) }))
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  updateProjectStatuses: async (projectId, statuses) => {
    await db.projects.update(projectId, { statuses, updatedAt: Date.now() })
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, statuses, updatedAt: Date.now() } : p,
      ),
    }))
  },
}))
