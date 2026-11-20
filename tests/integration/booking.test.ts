import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { cancelBookingByCustomer, createBooking, getAvailability, getPublicBusiness } from '@/lib/booking'
import { db } from '@/lib/db'
import { addDaysTo, formatTimeIn, todayIn, zonedInstant } from '@/lib/time'

const TZ = 'Asia/Kolkata'
const SLUG = 'itest-salon'
const tomorrow = addDaysTo(todayIn(TZ), 1)
const at = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return zonedInstant(tomorrow, h * 60 + m, TZ).toISOString()
}
const customer = { customerName: 'Asha Rao', customerPhone: '98765 43210' }

let serviceId = ''
let staffA = ''
let staffB = ''

beforeEach(async () => {
  await db.user.deleteMany({ where: { email: 'itest-owner@example.com' } }) // cascades to the business and its data
  const user = await db.user.create({ data: { email: 'itest-owner@example.com', name: 'Owner', passwordHash: 'x' } })
  const business = await db.business.create({
    data: {
      ownerId: user.id,
      name: 'Integration Salon',
      slug: SLUG,
      timezone: TZ,
      slotStepMin: 30,
      minNoticeMin: 0,
      maxDaysAhead: 30,
      workingHours: { create: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, openMin: 9 * 60, closeMin: 17 * 60 })) },
      services: { create: { name: 'Haircut', durationMin: 60, price: 900 } },
      staff: { create: [{ name: 'Alex' }, { name: 'Bina' }] },
    },
    include: { services: true, staff: { orderBy: { name: 'asc' } } },
  })
  serviceId = business.services[0].id
  ;[staffA, staffB] = business.staff.map((s) => s.id)
})

afterAll(async () => {
  await db.user.deleteMany({ where: { email: 'itest-owner@example.com' } })
  await db.$disconnect()
})

describe('availability', () => {
  it('offers every half hour that fits a 60-minute service between 9 and 5', async () => {
    const business = (await getPublicBusiness(SLUG))!
    const result = await getAvailability(business, serviceId, 'any', tomorrow)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.slots).toHaveLength(15)
    expect(formatTimeIn(result.slots[0].start, TZ)).toBe('9:00 AM')
    expect(formatTimeIn(result.slots.at(-1)!.start, TZ)).toBe('4:00 PM')
  })
})

describe('createBooking', () => {
  it('books a free slot and removes it for that staff member', async () => {
    const res = await createBooking(SLUG, { serviceId, staffId: staffA, start: at('10:00'), ...customer })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.code).toMatch(/^[A-Z2-9]{6}$/)

    const business = (await getPublicBusiness(SLUG))!
    const forA = await getAvailability(business, serviceId, staffA, tomorrow)
    const startsForA = forA.ok ? forA.slots.map((s) => formatTimeIn(s.start, TZ)) : []
    expect(startsForA).not.toContain('9:30 AM') // would overlap 10:00–11:00
    expect(startsForA).not.toContain('10:30 AM')
    expect(startsForA).toContain('9:00 AM') // back-to-back is fine
    expect(startsForA).toContain('11:00 AM')
  })

  it('stores the normalised phone number', async () => {
    const res = await createBooking(SLUG, { serviceId, staffId: staffA, start: at('09:00'), ...customer, customerPhone: '+91 98765-43210' })
    expect(res.ok).toBe(true)
    const saved = await db.booking.findFirst({ where: { serviceId } })
    expect(saved?.customerPhone).toBe('9876543210')
  })

  it('rejects the same staff member at an overlapping time', async () => {
    await createBooking(SLUG, { serviceId, staffId: staffA, start: at('10:00'), ...customer })
    const second = await createBooking(SLUG, { serviceId, staffId: staffA, start: at('10:00'), ...customer })
    expect(second).toMatchObject({ ok: false, status: 409 })
  })

  it('assigns another free staff member for "any", until everyone is busy', async () => {
    const first = await createBooking(SLUG, { serviceId, staffId: 'any', start: at('11:00'), ...customer })
    const second = await createBooking(SLUG, { serviceId, staffId: 'any', start: at('11:00'), ...customer })
    const third = await createBooking(SLUG, { serviceId, staffId: 'any', start: at('11:00'), ...customer })
    expect(first.ok && second.ok).toBe(true)
    expect(third).toMatchObject({ ok: false, status: 409 })
    const staffUsed = (await db.booking.findMany({ where: { serviceId }, select: { staffId: true } })).map((b) => b.staffId).sort()
    expect(staffUsed).toEqual([staffA, staffB].sort())
  })

  it('never double-books when many customers grab the same slot at once', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 8 }, () => createBooking(SLUG, { serviceId, staffId: staffB, start: at('14:00'), ...customer })),
    )
    expect(attempts.filter((a) => a.ok)).toHaveLength(1)
    expect(attempts.filter((a) => !a.ok).every((a) => !a.ok && a.status === 409)).toBe(true)
    expect(await db.booking.count({ where: { staffId: staffB, status: 'CONFIRMED' } })).toBe(1)
  })

  it('rejects times that are not offered slots', async () => {
    expect(await createBooking(SLUG, { serviceId, staffId: staffA, start: at('10:10'), ...customer })).toMatchObject({ status: 409 })
    expect(await createBooking(SLUG, { serviceId, staffId: staffA, start: at('16:30'), ...customer })).toMatchObject({ status: 409 }) // ends after close
    expect(await createBooking(SLUG, { serviceId, staffId: staffA, start: at('07:00'), ...customer })).toMatchObject({ status: 409 })
  })

  it('validates customer details', async () => {
    const res = await createBooking(SLUG, { serviceId, staffId: staffA, start: at('10:00'), customerName: 'A', customerPhone: '12345' })
    expect(res).toMatchObject({ ok: false, status: 400 })
    if (!res.ok) expect(Object.keys(res.fields ?? {}).sort()).toEqual(['customerName', 'customerPhone'])
  })

  it('returns 404 for an unknown business or service', async () => {
    expect(await createBooking('no-such-business', { serviceId, staffId: 'any', start: at('10:00'), ...customer })).toMatchObject({ status: 404 })
    expect(await createBooking(SLUG, { serviceId: 'nope', staffId: 'any', start: at('10:00'), ...customer })).toMatchObject({ status: 404 })
  })
})

describe('customer cancellation', () => {
  it('needs the secret token, then frees the slot', async () => {
    const res = await createBooking(SLUG, { serviceId, staffId: staffA, start: at('12:00'), ...customer })
    if (!res.ok) throw new Error('booking failed')

    expect(await cancelBookingByCustomer(res.code, 'wrong-token')).toMatchObject({ ok: false, status: 404 })
    expect(await cancelBookingByCustomer(res.code, res.cancelToken)).toEqual({ ok: true })

    const again = await createBooking(SLUG, { serviceId, staffId: staffA, start: at('12:00'), ...customer })
    expect(again.ok).toBe(true)
  })
})
