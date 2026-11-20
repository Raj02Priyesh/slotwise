import type { Metadata } from 'next'
import { requireBusiness } from '@/lib/auth'
import { db } from '@/lib/db'
import { HoursForm } from '../forms'

export const metadata: Metadata = { title: 'Opening hours' }

export default async function HoursPage() {
  const { business } = await requireBusiness()
  const hours = await db.workingHours.findMany({ where: { businessId: business.id }, select: { weekday: true, openMin: true, closeMin: true } })
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Opening hours</h1>
        <p className="mt-1 text-slate-600">Customers can only book times that start and finish inside these hours ({business.timezone}).</p>
      </div>
      <HoursForm hours={hours} />
    </div>
  )
}
