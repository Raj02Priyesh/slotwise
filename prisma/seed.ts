/**
 * Demo data: the fictional "Velvet & Vine" salon with a public demo owner login.
 * Re-running resets the demo business (its bookings included). Run: npm run db:seed
 */
import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../src/generated/prisma/client'
import { computeSlots, hoursFor } from '../src/lib/slots'
import { addDaysTo, todayIn } from '../src/lib/time'

const DEMO_EMAIL = 'demo@slotwise.app'
const DEMO_PASSWORD = 'demo1234'
const TZ = 'Asia/Kolkata'

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

const hours = [
  { weekday: 0, openMin: 10 * 60, closeMin: 18 * 60 },
  { weekday: 1, openMin: 10 * 60, closeMin: 20 * 60 },
  // Tuesday closed
  { weekday: 3, openMin: 10 * 60, closeMin: 20 * 60 },
  { weekday: 4, openMin: 10 * 60, closeMin: 20 * 60 },
  { weekday: 5, openMin: 10 * 60, closeMin: 21 * 60 },
  { weekday: 6, openMin: 9 * 60, closeMin: 21 * 60 },
]

const customers = ['Aditi Kulkarni', 'Rahul Jadhav', 'Sneha Pawar', 'Imran Shaikh', 'Meera Deshpande', 'Karan More', 'Pooja Gaikwad', 'Vikram Bhosale']

async function main() {
  await db.user.deleteMany({ where: { email: DEMO_EMAIL } }) // cascades to the demo business and its bookings

  const user = await db.user.create({
    data: { email: DEMO_EMAIL, name: 'Demo Owner', passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10) },
  })

  const business = await db.business.create({
    data: {
      ownerId: user.id,
      name: 'Velvet & Vine Salon',
      slug: 'velvet-vine',
      description: 'Hair, skin and nails in a calm studio on Baner Road, Pune. (Demo business - bookings here are not real.)',
      phone: '+91 20 0000 0001',
      address: 'Shop 4, Baner Road, Baner, Pune 411045',
      timezone: TZ,
      slotStepMin: 15,
      minNoticeMin: 60,
      maxDaysAhead: 30,
      workingHours: { create: hours },
      services: {
        create: [
          { name: 'Signature haircut', description: 'Consultation, wash, cut and finish', durationMin: 45, price: 900 },
          { name: 'Blow-dry & styling', description: 'Smooth, volume or waves', durationMin: 30, price: 700 },
          { name: 'Global colour', description: 'Ammonia-free, shoulder length', durationMin: 120, price: 3200 },
          { name: 'Glow facial', description: 'Cleanse, exfoliate, mask and massage', durationMin: 60, price: 2200 },
          { name: 'Classic manicure', description: 'Shape, cuticle care and polish', durationMin: 45, price: 600 },
        ],
      },
      staff: { create: [{ name: 'Neha Joshi' }, { name: 'Arjun Patil' }, { name: 'Kavya Shinde' }] },
    },
    include: { services: true, staff: true },
  })

  // A few bookings over the next week, placed only in genuinely free slots.
  const today = todayIn(TZ)
  let created = 0
  let n = 0
  for (let day = 1; day <= 7; day++) {
    const date = addDaysTo(today, day)
    const dayHours = hoursFor(date, hours)
    if (!dayHours) continue
    for (const [i, service] of business.services.entries()) {
      if ((day + i) % 2) continue
      const staff = business.staff[(day + i) % business.staff.length]
      const existing = await db.booking.findMany({ where: { staffId: staff.id }, select: { startAt: true, endAt: true } })
      const slots = computeSlots({
        date,
        hours: dayHours,
        durationMin: service.durationMin,
        rules: { timezone: TZ, stepMin: 15, minNoticeMin: 0, maxDaysAhead: 30 },
        staff: [{ id: staff.id, busy: existing.map((b) => ({ start: b.startAt, end: b.endAt })) }],
        now: new Date(),
      })
      if (!slots.ok || slots.slots.length === 0) continue
      const slot = slots.slots[Math.min(slots.slots.length - 1, 4 + ((day * 7 + i * 5) % 12))]
      const name = customers[n++ % customers.length]
      await db.booking.create({
        data: {
          code: `DEMO${String(created + 1).padStart(2, '0')}`,
          cancelToken: randomBytes(18).toString('base64url'),
          businessId: business.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: slot.start,
          endAt: slot.end,
          customerName: name,
          customerPhone: `90000000${String(10 + n).slice(-2)}`,
          notes: n % 3 === 0 ? 'First visit' : '',
        },
      })
      created++
    }
  }

  console.log(`Seeded demo business /book/${business.slug} with ${business.services.length} services, ${business.staff.length} staff and ${created} bookings.`)
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
