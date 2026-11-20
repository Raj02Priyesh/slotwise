import { describe, expect, it } from 'vitest'
import { computeSlots, hoursFor, type SlotRules } from './slots'
import { addDaysTo, formatTimeIn, hhmmToMinutes, isDateString, todayIn, weekdayOf, zonedInstant } from './time'

const IST = 'Asia/Kolkata'
const rules: SlotRules = { timezone: IST, stepMin: 30, minNoticeMin: 60, maxDaysAhead: 30 }
// "Now" is 08:00 IST on Monday 1 Dec 2025.
const now = zonedInstant('2025-12-01', 8 * 60, IST)
const times = (slots: { start: Date }[]) => slots.map((s) => formatTimeIn(s.start, IST))

describe('time helpers', () => {
  it('converts local wall-clock times to UTC instants', () => {
    expect(zonedInstant('2025-12-01', 9 * 60, IST).toISOString()).toBe('2025-12-01T03:30:00.000Z')
    expect(zonedInstant('2025-07-01', 9 * 60, 'Europe/London').toISOString()).toBe('2025-07-01T08:00:00.000Z') // BST
  })
  it('knows today in the business time zone', () => {
    // 20:00 UTC on 1 Dec is already 2 Dec in India.
    expect(todayIn(IST, new Date('2025-12-01T20:00:00Z'))).toBe('2025-12-02')
  })
  it('validates dates and times', () => {
    expect(isDateString('2025-02-29')).toBe(false)
    expect(isDateString('2024-02-29')).toBe(true)
    expect(weekdayOf('2025-12-01')).toBe(1)
    expect(addDaysTo('2025-12-31', 1)).toBe('2026-01-01')
    expect(hhmmToMinutes('09:30')).toBe(570)
    expect(hhmmToMinutes('25:00')).toBeNull()
  })
})

describe('computeSlots', () => {
  const base = { date: '2025-12-01', hours: { openMin: 9 * 60, closeMin: 12 * 60 }, durationMin: 60, rules, now }

  it('offers every step that fits before closing', () => {
    const r = computeSlots({ ...base, staff: [{ id: 'a', busy: [] }] })
    expect(r.ok && times(r.slots)).toEqual(['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'])
  })

  it('respects the minimum notice', () => {
    const r = computeSlots({ ...base, now: zonedInstant('2025-12-01', 9 * 60 + 10, IST), staff: [{ id: 'a', busy: [] }] })
    expect(r.ok && times(r.slots)[0]).toBe('10:30 AM')
  })

  it('removes slots overlapping a booking, but allows back-to-back', () => {
    const busy = [{ start: zonedInstant('2025-12-01', 10 * 60, IST), end: zonedInstant('2025-12-01', 11 * 60, IST) }]
    const r = computeSlots({ ...base, staff: [{ id: 'a', busy }] })
    expect(r.ok && times(r.slots)).toEqual(['9:00 AM', '11:00 AM'])
  })

  it('keeps a slot if any staff member is free, and lists who', () => {
    const busy = [{ start: zonedInstant('2025-12-01', 9 * 60, IST), end: zonedInstant('2025-12-01', 12 * 60, IST) }]
    const r = computeSlots({ ...base, staff: [{ id: 'a', busy }, { id: 'b', busy: [] }] })
    expect(r.ok && r.slots.length).toBe(5)
    expect(r.ok && r.slots.every((s) => s.staffIds.join() === 'b')).toBe(true)
  })

  it('reports closed days, past dates and dates too far ahead', () => {
    expect(computeSlots({ ...base, hours: null, staff: [] })).toEqual({ ok: false, reason: 'closed' })
    expect(computeSlots({ ...base, date: '2025-11-30', staff: [] })).toEqual({ ok: false, reason: 'past' })
    expect(computeSlots({ ...base, date: '2026-01-01', staff: [] })).toEqual({ ok: false, reason: 'too-far' })
  })

  it('returns no slots when the service is longer than the opening hours', () => {
    const r = computeSlots({ ...base, durationMin: 240, staff: [{ id: 'a', busy: [] }] })
    expect(r).toEqual({ ok: true, slots: [] })
  })
})

describe('hoursFor', () => {
  it('picks the weekday row', () => {
    const weekly = [{ weekday: 1, openMin: 600, closeMin: 1200 }]
    expect(hoursFor('2025-12-01', weekly)).toEqual({ openMin: 600, closeMin: 1200 })
    expect(hoursFor('2025-12-02', weekly)).toBeNull()
  })
})
