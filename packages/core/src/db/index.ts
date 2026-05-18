import Dexie, { type Table } from 'dexie'
import type { Project, List, Task, PomodoroSession } from '../types/index'

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
    this.version(2).stores({
      projects: 'id, name, createdAt',
      lists: 'id, projectId, order, createdAt',
      tasks: 'id, projectId, listId, statusId, priority, createdAt',
      sessions: 'id, taskId, projectId, startedAt, endedAt, completed',
    })
  }
}

export const db = new TimeFoundryDB()
