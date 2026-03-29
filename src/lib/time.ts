export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function parseTimeInput(input: string): number {
  const hourMatch = input.match(/(\d+)\s*h/i)
  const minMatch = input.match(/(\d+)\s*m/i)
  const numOnly = input.match(/^(\d+)$/)

  if (hourMatch || minMatch) {
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0
    const mins = minMatch ? parseInt(minMatch[1]) : 0
    return hours * 60 + mins
  }
  if (numOnly) return parseInt(numOnly[1])
  return 0
}

export function getDayBounds(date: Date): { start: number; end: number } {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { start: start.getTime(), end: end.getTime() }
}

export function getWeekBounds(date: Date): { start: number; end: number } {
  const start = new Date(date)
  // Monday-based week
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(date.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start: start.getTime(), end: end.getTime() }
}

export function getMonthBounds(date: Date): { start: number; end: number } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start: start.getTime(), end: end.getTime() }
}
