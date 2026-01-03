import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

export function getLocalDate(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone)
  return formatInTimeZone(zonedDate, timezone, 'yyyy-MM-dd')
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatDurationHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

