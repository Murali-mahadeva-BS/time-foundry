import {
  createTimeFoundryExport,
  db,
  type TimeFoundryExport,
  type TimeFoundryExportData,
} from '@time-foundry/core'

const SETTINGS_KEY = 'tf_settings'
const FILTER_KEY = 'tf_uiFilters'

type HostExportData = Pick<
  TimeFoundryExportData,
  'settings' | 'timerState' | 'pendingSessions' | 'taskSessionMinutes'
>

function readJsonLocalStorage<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

function writeJsonLocalStorage(key: string, value: unknown) {
  try {
    if (value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

async function bulkPutIfAny<T>(table: { bulkPut(items: T[]): Promise<unknown> }, items: T[]) {
  if (items.length > 0) await table.bulkPut(items)
}

export async function exportLocalData(hostData: HostExportData, appVersion?: string): Promise<TimeFoundryExport> {
  const [projects, lists, tasks, sessions] = await Promise.all([
    db.projects.toArray(),
    db.lists.toArray(),
    db.tasks.toArray(),
    db.sessions.toArray(),
  ])

  return createTimeFoundryExport({
    source: 'vscode',
    appVersion,
    data: {
      projects,
      lists,
      tasks,
      sessions,
      settings: hostData.settings ?? readJsonLocalStorage(SETTINGS_KEY),
      timerState: hostData.timerState,
      pendingSessions: hostData.pendingSessions ?? [],
      taskSessionMinutes: hostData.taskSessionMinutes ?? {},
      projectFilters: readJsonLocalStorage(FILTER_KEY),
    },
  })
}

export async function importLocalData(payload: TimeFoundryExport): Promise<void> {
  const { data } = payload

  await db.transaction('rw', db.projects, db.lists, db.tasks, db.sessions, async () => {
    await Promise.all([
      db.sessions.clear(),
      db.tasks.clear(),
      db.lists.clear(),
      db.projects.clear(),
    ])

    await bulkPutIfAny(db.projects, data.projects)
    await bulkPutIfAny(db.lists, data.lists)
    await bulkPutIfAny(db.tasks, data.tasks)
    await bulkPutIfAny(db.sessions, data.sessions)
  })

  writeJsonLocalStorage(SETTINGS_KEY, data.settings)
  writeJsonLocalStorage(FILTER_KEY, data.projectFilters)
}
