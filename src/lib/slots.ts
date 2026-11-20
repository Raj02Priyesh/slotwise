import { addDaysTo, todayIn, weekdayOf, zonedInstant, type DateString } from './time'

export interface Interval {
  start: Date
  end: Date
}

export interface SlotRules {
  timezone: string
  /** Minutes between candidate start times. */
  stepMin: number
  /** Minimum minutes between now and a booking's start. */
  minNoticeMin: number
  /** Furthest date (in days from today) that can be booked. */
  maxDaysAhead: number
}

export interface DayHours {
  openMin: number
  closeMin: number
}

export interface StaffSchedule {
  id: string
  /** Existing active (non-cancelled) bookings for this staff member. */
  busy: Interval[]
}

export interface Slot {
  start: Date
  end: Date
  /** Staff members free for the whole slot, in the order given. */
  staffIds: string[]
}

export type SlotsResult =
  | { ok: true; slots: Slot[] }
  | { ok: false; reason: 'closed' | 'past' | 'too-far' }

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end

/**
 * Bookable start times for one service on one calendar date.
 *
 * A slot is offered when it fits inside opening hours, starts at least `minNoticeMin` from now,
 * and at least one of the given staff has no overlapping booking.
 */
export function computeSlots(params: {
  date: DateString
  hours: DayHours | null
  durationMin: number
  rules: SlotRules
  staff: StaffSchedule[]
  now: Date
}): SlotsResult {
  const { date, hours, durationMin, rules, staff, now } = params
  const today = todayIn(rules.timezone, now)
  if (date < today) return { ok: false, reason: 'past' }
  if (date > addDaysTo(today, rules.maxDaysAhead)) return { ok: false, reason: 'too-far' }
  if (!hours || hours.closeMin <= hours.openMin) return { ok: false, reason: 'closed' }

  const earliest = new Date(now.getTime() + rules.minNoticeMin * 60_000)
  const step = Math.max(5, rules.stepMin)
  const slots: Slot[] = []

  for (let m = hours.openMin; m + durationMin <= hours.closeMin; m += step) {
    const start = zonedInstant(date, m, rules.timezone)
    if (start < earliest) continue
    const candidate = { start, end: new Date(start.getTime() + durationMin * 60_000) }
    const free = staff.filter((s) => !s.busy.some((b) => overlaps(candidate, b))).map((s) => s.id)
    if (free.length) slots.push({ ...candidate, staffIds: free })
  }
  return { ok: true, slots }
}

/** Opening hours for `date` from a weekly schedule. */
export function hoursFor(date: DateString, weekly: { weekday: number; openMin: number; closeMin: number }[]): DayHours | null {
  const row = weekly.find((w) => w.weekday === weekdayOf(date))
  return row ? { openMin: row.openMin, closeMin: row.closeMin } : null
}
