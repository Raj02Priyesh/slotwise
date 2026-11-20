import { TZDate } from '@date-fns/tz'
import { addDays, format } from 'date-fns'

/** A calendar date like "2026-12-01" (no time zone attached). */
export type DateString = string

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isDateString(value: unknown): value is DateString {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/** Day of week (0 = Sunday) of a calendar date — the same in every time zone. */
export function weekdayOf(date: DateString): number {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** The instant at `minutes` after local midnight of `date` in `timeZone`. */
export function zonedInstant(date: DateString, minutes: number, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(new TZDate(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, timeZone).getTime())
}

/** Today's calendar date in `timeZone`. */
export function todayIn(timeZone: string, now: Date = new Date()): DateString {
  return format(new TZDate(now.getTime(), timeZone), 'yyyy-MM-dd')
}

export function addDaysTo(date: DateString, days: number): DateString {
  const [y, m, d] = date.split('-').map(Number)
  return format(addDays(new Date(y, m - 1, d), days), 'yyyy-MM-dd')
}

/** "9:30 AM" for an instant, shown in the business's time zone. */
export function formatTimeIn(instant: Date, timeZone: string): string {
  return format(new TZDate(instant.getTime(), timeZone), 'h:mm a')
}

/** "Mon, 1 Dec 2026" for an instant in the business's time zone. */
export function formatDateIn(instant: Date, timeZone: string): string {
  return format(new TZDate(instant.getTime(), timeZone), 'EEE, d MMM yyyy')
}

/** "Monday, 1 December" for a calendar date. */
export function formatDateLong(date: DateString): string {
  const [y, m, d] = date.split('-').map(Number)
  return format(new Date(y, m - 1, d), 'EEEE, d MMMM')
}

/** Minutes after midnight <-> "HH:MM". */
export function minutesToHHMM(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function hhmmToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return null
  return h * 60 + m
}

/** "9:30 AM" for minutes after midnight. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
