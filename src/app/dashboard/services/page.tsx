import type { Metadata } from 'next'
import { requireBusiness } from '@/lib/auth'
import { formatDuration, formatPrice } from '@/lib/constants'
import { db } from '@/lib/db'
import { toggleService } from '../actions'
import { EditServiceToggle, ServiceForm } from '../forms'

export const metadata: Metadata = { title: 'Services' }

export default async function ServicesPage({ searchParams }: PageProps<'/dashboard/services'>) {
  const { business } = await requireBusiness()
  const welcome = (await searchParams).welcome === '1'
  const services = await db.service.findMany({ where: { businessId: business.id }, orderBy: [{ active: 'desc' }, { createdAt: 'asc' }] })

  return (
    <div className="space-y-8">
      {welcome && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-brand-900">
          <p className="font-semibold">🎉 Your booking page is ready.</p>
          <p className="mt-1 text-sm">Step 2 of 2: add the services customers can book. We’ve set you up as the first team member and opened Monday–Saturday, 10 AM–7 PM — change these any time.</p>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="mt-1 text-slate-600">What customers can book, how long it takes and what it costs.</p>
      </div>

      <section className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">Add a service</h2>
        <ServiceForm />
      </section>

      <section>
        <h2 className="sr-only">Your services</h2>
        {services.length === 0 ? (
          <p className="card p-8 text-center text-slate-500">No services yet — add your first one above.</p>
        ) : (
          <ul className="card divide-y divide-slate-100">
            {services.map((s) => (
              <li key={s.id} className={`flex flex-wrap items-center gap-4 p-4 ${s.active ? '' : 'opacity-60'}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {s.name} {!s.active && <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">hidden</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDuration(s.durationMin)} · {formatPrice(s.price)}
                    {s.description && <> · {s.description}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <EditServiceToggle service={{ id: s.id, name: s.name, description: s.description, durationMin: s.durationMin, price: s.price }} />
                  <form action={toggleService}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={String(!s.active)} />
                    <button className="btn-secondary">{s.active ? 'Hide' : 'Show'}</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
