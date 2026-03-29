import Dexie, { type Table } from 'dexie'
import type { Project, List, Task, PomodoroSession } from '@/types'

class TimeFoundryDB extends Dexie {
  projects!: Table<Project>
  lists!: Table<List>
  tasks!: Table<Task>
  sessions!: Table<PomodoroSession>

  constructor() {
    super('TimeFoundryDB')
    this.version(1).stores({
      projects: 'id, name, createdAt',
      lists: 'id, projectId, order, createdAt',
      tasks: 'id, projectId, listId, statusId, priority, createdAt',
      sessions: 'id, taskId, projectId, startedAt, endedAt, completed',
    })
    // v2: adds icon to projects/lists, content to tasks (non-indexed fields, no schema change needed)
    this.version(2).stores({
      projects: 'id, name, createdAt',
      lists: 'id, projectId, order, createdAt',
      tasks: 'id, projectId, listId, statusId, priority, createdAt',
      sessions: 'id, taskId, projectId, startedAt, endedAt, completed',
    })
  }
}

export const db = new TimeFoundryDB()
