import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  statuses: text('statuses').notNull(), // JSON: Status[]
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const lists = sqliteTable('lists', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon'),
  order: integer('order').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  listId: text('list_id').notNull(),
  title: text('title').notNull(),
  content: text('content'), // Markdown string
  estimatedMinutes: integer('estimated_minutes').notNull().default(0),
  priority: text('priority').notNull().default('medium'),
  statusId: text('status_id').notNull(),
  order: integer('order').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  projectId: text('project_id').notNull(),
  startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at').notNull(),
  durationMinutes: real('duration_minutes').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull(),
  sessionType: text('session_type').notNull(),
})
