import 'server-only'
import { randomBytes, randomInt } from 'node:crypto'
import { db } from './db'
import { computeSlots, hoursFor, type SlotsResult } from './slots'
import { todayIn, type DateString } from './time'
import { bookingRequestSchema, fieldErrors } from './validation'
import type { z } from 'zod'

/** Public data for a business's booking page (active services and staff only). */
export async function getPublicBusiness(slug: string) {
  return db.business.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { createdAt: 'asc' } },
      staff: { where: { active: true }, orderBy: { createdAt: 'asc' } },
      workingHours: true,
    },
  })
}

type PublicBusiness = NonNullable<Awaited<ReturnType<typeof getPublicBusiness>>>

/** Available slots for a service on a date, optionally for one staff member. */
export async function getAvailability(business: PublicBusiness, serviceId: string, staffId: string, date: DateString, now = new Date()): Promise<SlotsResult | { ok: false; reason: 'not-found' }> {
  const service = business.services.find((s) => s.id === serviceId)
  const staff = staffId === 'any' ? business.staff : business.staff.filter((s) => s.id === staffId)
  if (!service || staff.length === 0) return { ok: false, reason: 'not-found' }

  // Load bookings that could overlap the day (a generous ±1 day window covers every time zone).
  const dayStart = new Date(`${date}T00:00:00Z`)
  const windowStart = new Date(dayStart.getTime() - 86_400_000)
  const windowEnd = new Date(dayStart.getTime() + 2 * 86_400_000)
  const bookings = await db.booking.findMany({
    where: {
      staffId: { in: staff.map((s) => s.id) },
      status: { not: 'CANCELLED' },
      startAt: { lt: windowEnd },
      endAt: { gt: windowStart },
    },
    select: { staffId: true, startAt: true, endAt: true },
  })

  return computeSlots({
    date,
    hours: hoursFor(date, business.workingHours),
    durationMin: service.durationMin,
    rules: {
      timezone: business.timezone,
      stepMin: business.slotStepMin,
      minNoticeMin: business.minNoticeMin,
      maxDaysAhead: business.maxDaysAhead,
    },
    staff: staff.map((s) => ({
      id: s.id,
      busy: bookings.filter((b) => b.staffId === s.id).map((b) => ({ start: b.startAt, end: b.endAt })),
    })),
    now,
  })
}

export type CreateBookingResult =
  | { ok: true; code: string; cancelToken: string }
  | { ok: false; status: 400 | 404 | 409; error: string; fields?: Record<string, string> }

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

function newCode() {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
}

/** True if a database error is the "no overlapping bookings" exclusion constraint. */
export function isOverlapError(error: unknown): boolean {
  const text = JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})) + String(error)
  return text.includes('Booking_no_overlap') || text.includes('23P01')
}

/**
 * Books a slot. The requested start must be one of the currently offered slots; the database's
 * exclusion constraint is the final guard against two people taking the same slot at once.
 */
export async function createBooking(slug: string, input: z.input<typeof bookingRequestSchema>, now = new Date()): Promise<CreateBookingResult> {
  const parsed = bookingRequestSchema.safeParse(input)
  if (!parsed.success) return { ok: false, status: 400, error: 'Please check your details.', fields: fieldErrors(parsed.error) }
  const req = parsed.data

  const business = await getPublicBusiness(slug)
  if (!business) return { ok: false, status: 404, error: 'Business not found.' }
  const service = business.services.find((s) => s.id === req.serviceId)
  if (!service) return { ok: false, status: 404, error: 'That service is no longer available.' }

  const start = new Date(req.start)
  const date = todayIn(business.timezone, start) // calendar date of the slot in the business's zone
  const availability = await getAvailability(business, req.serviceId, req.staffId, date, now)
  if (!availability.ok) return { ok: false, status: 409, error: 'That time is no longer available. Please pick another slot.' }

  const slot = availability.slots.find((s) => s.start.getTime() === start.getTime())
  if (!slot) return { ok: false, status: 409, error: 'That time is no longer available. Please pick another slot.' }

  // Try each free staff member in turn (only one for a specific-staff booking).
  for (const staffId of slot.staffIds) {
    try {
      const code = await uniqueCode()
      const cancelToken = randomBytes(18).toString('base64url')
      await db.booking.create({
        data: {
          code,
          cancelToken,
          businessId: business.id,
          serviceId: service.id,
          staffId,
          startAt: slot.start,
          endAt: slot.end,
          customerName: req.customerName,
          customerPhone: req.customerPhone,
          customerEmail: req.customerEmail,
          notes: req.notes,
        },
      })
      return { ok: true, code, cancelToken }
    } catch (error) {
      if (isOverlapError(error)) continue // someone else just took this staff member's slot
      throw error
    }
  }
  return { ok: false, status: 409, error: 'Sorry — someone just booked that time. Please pick another slot.' }
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = newCode()
    if (!(await db.booking.findUnique({ where: { code }, select: { id: true } }))) return code
  }
  throw new Error('Could not generate a booking code')
}

/** Customer self-service cancellation using the secret token from their confirmation link. */
export async function cancelBookingByCustomer(code: string, token: string, now = new Date()) {
  const booking = await db.booking.findUnique({ where: { code } })
  if (!booking || booking.cancelToken !== token) return { ok: false as const, status: 404, error: 'Booking not found.' }
  if (booking.status === 'CANCELLED') return { ok: true as const }
  if (booking.status === 'COMPLETED' || booking.startAt <= now) {
    return { ok: false as const, status: 409, error: 'This appointment has already started and can’t be cancelled online.' }
  }
  await db.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } })
  return { ok: true as const }
}
