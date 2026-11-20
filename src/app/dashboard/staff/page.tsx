import type { Metadata } from 'next'
import { requireBusiness } from '@/lib/auth'
import { db } from '@/lib/db'
import { toggleStaff } from '../actions'
import { StaffForm } from '../forms'

export const metadata: Metadata = { title: 'Team' }

export default async function StaffPage() {
  const { business } = await requireBusiness()
  const staff = await db.staff.findMany({ where: { businessId: business.id }, orderBy: [{ active: 'desc' }, { createdAt: 'asc' }] })
  const activeCount = staff.filter((s) => s.active).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="mt-1 text-slate-600">
          Each team member has their own calendar, so two customers can book the same time with different people.
        </p>
      </div>
      <section className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">Add a team member</h2>
        <StaffForm />
      </section>
      <ul className="card divide-y divide-slate-100">
        {staff.map((s) => (
          <li key={s.id} className={`flex items-center gap-4 p-4 ${s.active ? '' : 'opacity-60'}`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700" aria-hidden="true">
              {s.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </span>
            <p className="flex-1 font-medium">
              {s.name} {!s.active && <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">not bookable</span>}
            </p>
            <form action={toggleStaff}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="active" value={String(!s.active)} />
              <button className="btn-secondary" disabled={s.active && activeCount <= 1} title={s.active && activeCount <= 1 ? 'Keep at least one bookable team member' : undefined}>
                {s.active ? 'Pause bookings' : 'Make bookable'}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
