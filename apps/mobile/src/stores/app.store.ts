import { create } from 'zustand'
import { eq, asc } from 'drizzle-orm'
import { db } from '../db/client'
import * as schema from '../db/schema'
import { generateId } from '../lib/utils'
import type { Project, List, Task, Status, PomodoroSession } from '@time-foundry/core'

export const DEFAULT_STATUSES: Omit<Status, 'id'>[] = [
  { name: 'Todo', color: '#94a3b8', order: 0 },
  { name: 'In Progress', color: '#3b82f6', order: 1 },
  { name: 'Done', color: '#22c55e', order: 2 },
]

function makeDefaultStatuses(): Status[] {
  return DEFAULT_STATUSES.map((s) => ({ ...s, id: generateId() }))
}

// Drizzle rows use snake_case columns; map them to the shared camelCase types
function rowToProject(row: typeof schema.projects.$inferSelect): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    icon: row.icon ?? undefined,
    statuses: JSON.parse(row.statuses) as Status[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function rowToList(row: typeof schema.lists.$inferSelect): List {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    icon: row.icon ?? undefined,
    order: row.order,
    createdAt: row.createdAt,
  }
}

function rowToTask(row: typeof schema.tasks.$inferSelect): Task {
  return {
    id: row.id,
    projectId: row.projectId,
    listId: row.listId,
    title: row.title,
    content: row.content ?? undefined,
    estimatedMinutes: row.estimatedMinutes,
    priority: row.priority as Task['priority'],
    statusId: row.statusId,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function rowToSession(row: typeof schema.sessions.$inferSelect): PomodoroSession {
  return {
    id: row.id,
    taskId: row.taskId,
    projectId: row.projectId,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    durationMinutes: row.durationMinutes,
    completed: row.completed,
    sessionType: row.sessionType as PomodoroSession['sessionType'],
  }
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

  getSessionsForTask: (taskId: string) => Promise<PomodoroSession[]>
  insertSession: (session: PomodoroSession) => Promise<void>
  getTaskSessionMinutes: (taskId: string) => Promise<number>
  getAllSessions: () => Promise<PomodoroSession[]>
}

export const useAppStore = create<AppStore>((set, get) => ({
  projects: [],
  lists: [],
  tasks: [],

  loadAll: async () => {
    const [projectRows, listRows, taskRows] = await Promise.all([
      db.select().from(schema.projects).orderBy(asc(schema.projects.createdAt)),
      db.select().from(schema.lists).orderBy(asc(schema.lists.order)),
      db.select().from(schema.tasks).orderBy(asc(schema.tasks.createdAt)),
    ])
    set({
      projects: projectRows.map(rowToProject),
      lists: listRows.map(rowToList),
      tasks: taskRows.map(rowToTask),
    })
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
    await db.insert(schema.projects).values({
      id: project.id,
      name: project.name,
      description: project.description ?? null,
      icon: project.icon ?? null,
      statuses: JSON.stringify(project.statuses),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
    set((s) => ({ projects: [...s.projects, project] }))
    return project
  },

  updateProject: async (id, data) => {
    const updatedAt = Date.now()
    const row: Partial<typeof schema.projects.$inferInsert> = { updatedAt }
    if (data.name !== undefined) row.name = data.name
    if (data.description !== undefined) row.description = data.description ?? null
    if (data.icon !== undefined) row.icon = data.icon ?? null
    if (data.statuses !== undefined) row.statuses = JSON.stringify(data.statuses)
    await db.update(schema.projects).set(row).where(eq(schema.projects.id, id))
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt } : p,
      ),
    }))
  },

  deleteProject: async (id) => {
    const listIds = get().lists.filter((l) => l.projectId === id).map((l) => l.id)
    for (const listId of listIds) {
      await db.delete(schema.tasks).where(eq(schema.tasks.listId, listId))
    }
    await db.delete(schema.lists).where(eq(schema.lists.projectId, id))
    await db.delete(schema.projects).where(eq(schema.projects.id, id))
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      lists: s.lists.filter((l) => l.projectId !== id),
      tasks: s.tasks.filter((t) => t.projectId !== id),
    }))
  },

  createList: async (projectId, name, icon) => {
    const order = get().lists.filter((l) => l.projectId === projectId).length
    const list: List = { id: generateId(), projectId, name, icon, order, createdAt: Date.now() }
    await db.insert(schema.lists).values({
      id: list.id,
      projectId: list.projectId,
      name: list.name,
      icon: list.icon ?? null,
      order: list.order,
      createdAt: list.createdAt,
    })
    set((s) => ({ lists: [...s.lists, list] }))
    return list
  },

  updateList: async (id, data) => {
    await db.update(schema.lists).set({
      name: data.name,
      icon: data.icon ?? null,
    }).where(eq(schema.lists.id, id))
    set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, ...data } : l)) }))
  },

  deleteList: async (id) => {
    await db.delete(schema.tasks).where(eq(schema.tasks.listId, id))
    await db.delete(schema.lists).where(eq(schema.lists.id, id))
    set((s) => ({
      lists: s.lists.filter((l) => l.id !== id),
      tasks: s.tasks.filter((t) => t.listId !== id),
    }))
  },

  createTask: async (data) => {
    const order = get().tasks.filter((t) => t.listId === data.listId).length
    const task: Task = { ...data, id: generateId(), order, createdAt: Date.now(), updatedAt: Date.now() }
    await db.insert(schema.tasks).values({
      id: task.id,
      projectId: task.projectId,
      listId: task.listId,
      title: task.title,
      content: task.content ?? null,
      estimatedMinutes: task.estimatedMinutes,
      priority: task.priority,
      statusId: task.statusId,
      order: task.order,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })
    set((s) => ({ tasks: [...s.tasks, task] }))
    return task
  },

  updateTask: async (id, data) => {
    const updatedAt = Date.now()
    const row: Partial<typeof schema.tasks.$inferInsert> = { updatedAt }
    if (data.title !== undefined) row.title = data.title
    if (data.content !== undefined) row.content = data.content ?? null
    if (data.estimatedMinutes !== undefined) row.estimatedMinutes = data.estimatedMinutes
    if (data.priority !== undefined) row.priority = data.priority
    if (data.statusId !== undefined) row.statusId = data.statusId
    if (data.order !== undefined) row.order = data.order
    await db.update(schema.tasks).set(row).where(eq(schema.tasks.id, id))
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data, updatedAt } : t)),
    }))
  },

  deleteTask: async (id) => {
    await db.delete(schema.tasks).where(eq(schema.tasks.id, id))
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  updateProjectStatuses: async (projectId, statuses) => {
    const updatedAt = Date.now()
    await db.update(schema.projects)
      .set({ statuses: JSON.stringify(statuses), updatedAt })
      .where(eq(schema.projects.id, projectId))
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, statuses, updatedAt } : p,
      ),
    }))
  },

  getSessionsForTask: async (taskId) => {
    const rows = await db.select().from(schema.sessions)
      .where(eq(schema.sessions.taskId, taskId))
    return rows.map(rowToSession)
  },

  insertSession: async (session) => {
    await db.insert(schema.sessions).values({
      id: session.id,
      taskId: session.taskId,
      projectId: session.projectId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationMinutes: session.durationMinutes,
      completed: session.completed,
      sessionType: session.sessionType,
    })
  },

  getTaskSessionMinutes: async (taskId) => {
    const rows = await db.select().from(schema.sessions)
      .where(eq(schema.sessions.taskId, taskId))
    return rows.reduce((sum, r) => sum + r.durationMinutes, 0)
  },

  getAllSessions: async () => {
    const rows = await db.select().from(schema.sessions)
      .orderBy(asc(schema.sessions.startedAt))
    return rows.map(rowToSession)
  },
}))
