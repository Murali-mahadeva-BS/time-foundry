import { openDatabaseSync } from 'expo-sqlite'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import * as schema from './schema'

const expo = openDatabaseSync('time-foundry.db', { enableChangeListener: true })

// Create tables on first run; safe to re-run (IF NOT EXISTS)
expo.execSync(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    statuses TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    "order" INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    list_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    estimated_minutes INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium',
    status_id TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER NOT NULL,
    duration_minutes REAL NOT NULL,
    completed INTEGER NOT NULL,
    session_type TEXT NOT NULL
  );
`)

export const db = drizzle(expo, { schema })
