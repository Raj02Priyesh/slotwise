import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicBusiness } from '@/lib/booking'
import { todayIn } from '@/lib/time'
import { BookingWidget } from './BookingWidget'

export async function generateMetadata({ params }: PageProps<'/book/[slug]'>): Promise<Metadata> {
  const business = await getPublicBusiness((await params).slug)
  return business
    ? { title: `Book with ${business.name}`, description: business.description || `Book an appointment with ${business.name} online.` }
    : { title: 'Not found' }
}

export default async function BookingPage({ params }: PageProps<'/book/[slug]'>) {
  const business = await getPublicBusiness((await params).slug)
  if (!business) notFound()

  const ready = business.services.length > 0 && business.staff.length > 0 && business.workingHours.length > 0

  return (
    <main className="flex-1 bg-gradient-to-b from-brand-50 to-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-sm font-medium text-brand-700">Book online</p>
          <h1 className="mt-1 text-3xl font-bold">{business.name}</h1>
          {business.description && <p className="mt-2 text-slate-600">{business.description}</p>}
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            {business.address && <span>📍 {business.address}</span>}
            {business.phone && <span>📞 {business.phone}</span>}
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 pt-8">
        {ready ? (
          <BookingWidget
            slug={business.slug}
            timezone={business.timezone}
            today={todayIn(business.timezone)}
            maxDaysAhead={business.maxDaysAhead}
            openWeekdays={business.workingHours.map((h) => h.weekday)}
            services={business.services.map(({ id, name, description, durationMin, price }) => ({ id, name, description, durationMin, price }))}
            staff={business.staff.map(({ id, name }) => ({ id, name }))}
          />
        ) : (
          <p className="card p-8 text-center text-slate-600">{business.name} isn’t taking online bookings yet. Please check back soon.</p>
        )}
        <p className="mt-10 text-center text-xs text-slate-400">
          Powered by <Link href="/" className="font-medium hover:text-brand-700">Slotwise</Link>
        </p>
      </div>
    </main>
  )
}
