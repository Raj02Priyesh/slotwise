import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDuration, formatPrice } from '@/lib/constants'
import { db } from '@/lib/db'
import { formatDateIn, formatTimeIn } from '@/lib/time'
import { CancelBookingButton } from './CancelBookingButton'

export const metadata: Metadata = { title: 'Your booking', robots: { index: false } }

export default async function BookingConfirmationPage({ params, searchParams }: PageProps<'/book/[slug]/b/[code]'>) {
  const { slug, code } = await params
  const token = (await searchParams).t
  const booking = await db.booking.findUnique({
    where: { code },
    include: { business: true, service: true, staff: { select: { name: true } } },
  })
  // The secret token in the link is required, so a guessed code reveals nothing.
  if (!booking || booking.business.slug !== slug || typeof token !== 'string' || token !== booking.cancelToken) notFound()

  const { business } = booking
  const tz = business.timezone
  const cancelled = booking.status === 'CANCELLED'
  const canCancel = booking.status === 'CONFIRMED' && booking.startAt > new Date()

  return (
    <main className="flex flex-1 items-start justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-12">
      <div className="card w-full max-w-lg p-6 sm:p-8">
        <div className="text-center">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${cancelled ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`} aria-hidden="true">
            {cancelled ? '✕' : '✓'}
          </div>
          <h1 className="mt-4 text-2xl font-bold">{cancelled ? 'Booking cancelled' : 'You’re booked!'}</h1>
          <p className="mt-1 text-slate-600">
            {cancelled ? 'This appointment has been cancelled.' : `${business.name} is expecting you.`}
          </p>
        </div>

        <dl className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
          {[
            ['Reference', booking.code],
            ['Service', `${booking.service.name} · ${formatDuration(booking.service.durationMin)}`],
            ['When', `${formatDateIn(booking.startAt, tz)}, ${formatTimeIn(booking.startAt, tz)}–${formatTimeIn(booking.endAt, tz)}`],
            ['With', booking.staff.name],
            ['Price', `${formatPrice(booking.service.price)} (pay at the appointment)`],
            ['Name', booking.customerName],
            ['Phone', `+91 ${booking.customerPhone}`],
            ...(business.address ? [['Where', business.address]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        {!cancelled && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Bookmark this page — it’s your private link to view or cancel this booking.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={`/book/${business.slug}`} className="btn-secondary flex-1">Book another</Link>
          {canCancel && <CancelBookingButton code={booking.code} token={token} />}
        </div>
      </div>
    </main>
  )
}
