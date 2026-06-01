export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function parseTimeInput(raw: string): number {
  const str = raw.trim().toLowerCase()
  let total = 0
  const hMatch = str.match(/(\d+)\s*h/)
  const mMatch = str.match(/(\d+)\s*m/)
  const numOnly = str.match(/^\d+$/)
  if (hMatch) total += parseInt(hMatch[1]) * 60
  if (mMatch) total += parseInt(mMatch[1])
  if (numOnly) total = parseInt(str)
  return total
}
