import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { CopyButton } from '@/components/ui'
import { requireBusiness } from '@/lib/auth'
import { formatPrice } from '@/lib/constants'
import { db } from '@/lib/db'
import { formatDateIn, formatTimeIn, todayIn, zonedInstant, addDaysTo } from '@/lib/time'
import { setBookingStatus } from './actions'
import { CancelBookingForm } from './CancelBookingForm'

export const metadata: Metadata = { title: 'Bookings' }

const VIEWS = { upcoming: 'Upcoming', past: 'Past', cancelled: 'Cancelled' } as const
type View = keyof typeof VIEWS

export default async function BookingsPage({ searchParams }: PageProps<'/dashboard'>) {
  const { business } = await requireBusiness()
  const params = await searchParams
  const view: View = params.view === 'past' || params.view === 'cancelled' ? params.view : 'upcoming'
  const now = new Date()
  const tz = business.timezone

  const [services, staffCount, hoursCount, bookings, todayCount, weekCount] = await Promise.all([
    db.service.count({ where: { businessId: business.id, active: true } }),
    db.staff.count({ where: { businessId: business.id, active: true } }),
    db.workingHours.count({ where: { businessId: business.id } }),
    db.booking.findMany({
      where: {
        businessId: business.id,
        ...(view === 'upcoming' && { status: 'CONFIRMED', endAt: { gte: now } }),
        ...(view === 'past' && { status: { not: 'CANCELLED' }, endAt: { lt: now } }),
        ...(view === 'cancelled' && { status: 'CANCELLED' }),
      },
      include: { service: { select: { name: true, price: true } }, staff: { select: { name: true } } },
      orderBy: { startAt: view === 'upcoming' ? 'asc' : 'desc' },
      take: 100,
    }),
    db.booking.count({
      where: { businessId: business.id, status: 'CONFIRMED', startAt: { gte: zonedInstant(todayIn(tz), 0, tz), lt: zonedInstant(addDaysTo(todayIn(tz), 1), 0, tz) } },
    }),
    db.booking.count({
      where: { businessId: business.id, status: 'CONFIRMED', startAt: { gte: now, lt: new Date(now.getTime() + 7 * 86_400_000) } },
    }),
  ])

  const host = (await headers()).get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https'
  const bookingUrl = `${proto}://${host}/book/${business.slug}`
  const setupDone = services > 0 && staffCount > 0 && hoursCount > 0

  // Group by local calendar day.
  const groups = new Map<string, typeof bookings>()
  for (const b of bookings) {
    const key = formatDateIn(b.startAt, tz)
    groups.set(key, [...(groups.get(key) ?? []), b])
  }

  return (
    <div className="space-y-8">
      {!setupDone && (
        <section className="card border-amber-200 bg-amber-50 p-5" aria-label="Finish setting up">
          <h2 className="font-semibold text-amber-900">Finish setting up to start taking bookings</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <Check done={services > 0} href="/dashboard/services">Add at least one service</Check>
            <Check done={staffCount > 0} href="/dashboard/staff">Add a team member</Check>
            <Check done={hoursCount > 0} href="/dashboard/hours">Set your opening hours</Check>
          </ul>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Today" value={todayCount} />
        <Stat label="Next 7 days" value={weekCount} />
        <div className="card p-5">
          <p className="text-sm text-slate-500">Your booking link</p>
          <p className="mt-1 truncate font-medium text-brand-700">{bookingUrl.replace(/^https?:\/\//, '')}</p>
          <div className="mt-3 flex gap-2">
            <CopyButton text={bookingUrl} />
            <Link href={`/book/${business.slug}`} target="_blank" className="btn-secondary">Open</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Bookings</h1>
          <nav aria-label="Filter bookings" className="flex rounded-lg border border-slate-200 bg-white p-1">
            {(Object.keys(VIEWS) as View[]).map((v) => (
              <Link
                key={v}
                href={v === 'upcoming' ? '/dashboard' : `/dashboard?view=${v}`}
                aria-current={view === v ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === v ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {VIEWS[v]}
              </Link>
            ))}
          </nav>
        </div>

        {bookings.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">
            {view === 'upcoming' ? 'No upcoming bookings yet. Share your booking link to get started.' : `No ${VIEWS[view].toLowerCase()} bookings.`}
          </div>
        ) : (
          <div className="space-y-6">
            {[...groups.entries()].map(([day, items]) => (
              <div key={day}>
                <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">{day}</h2>
                <ul className="card divide-y divide-slate-100">
                  {items.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
                      <div className="w-24 shrink-0">
                        <p className="font-semibold">{formatTimeIn(b.startAt, tz)}</p>
                        <p className="text-xs text-slate-500">to {formatTimeIn(b.endAt, tz)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{b.customerName}</p>
                        <p className="text-sm text-slate-500">
                          {b.service.name} · with {b.staff.name} · {formatPrice(b.service.price)}
                        </p>
                        <p className="text-sm text-slate-500">
                          <a href={`tel:+91${b.customerPhone}`} className="hover:text-brand-700">+91 {b.customerPhone}</a>
                          {b.customerEmail && <> · {b.customerEmail}</>} · Ref {b.code}
                        </p>
                        {b.notes && <p className="mt-1 text-sm text-slate-600 italic">“{b.notes}”</p>}
                      </div>
                      <StatusBadge status={b.status} />
                      {b.status === 'CONFIRMED' && (
                        <div className="flex gap-2">
                          {b.startAt <= now && (
                            <form action={setBookingStatus}>
                              <input type="hidden" name="id" value={b.id} />
                              <input type="hidden" name="status" value="COMPLETED" />
                              <button className="btn-secondary">Mark done</button>
                            </form>
                          )}
                          <CancelBookingForm id={b.id} customer={b.customerName} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      <p className="text-sm text-slate-500">{value === 1 ? 'booking' : 'bookings'}</p>
    </div>
  )
}

function Check({ done, href, children }: { done: boolean; href: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className={done ? 'text-emerald-600' : 'text-amber-600'} aria-hidden="true">{done ? '✓' : '○'}</span>
      {done ? <span className="text-slate-500 line-through">{children}</span> : <Link href={href} className="font-medium text-amber-900 underline">{children}</Link>}
    </li>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CONFIRMED: 'bg-brand-50 text-brand-700',
    COMPLETED: 'bg-slate-100 text-slate-600',
    CANCELLED: 'bg-red-50 text-red-600',
  }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status.toLowerCase()}</span>
}
