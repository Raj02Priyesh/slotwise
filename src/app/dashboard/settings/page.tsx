import type { Metadata } from 'next'
import { requireBusiness } from '@/lib/auth'
import { SettingsForm } from '../forms'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const { business } = await requireBusiness()
  const { name, slug, description, phone, address, timezone, slotStepMin, minNoticeMin, maxDaysAhead } = business
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsForm values={{ name, slug, description, phone, address, timezone, slotStepMin, minNoticeMin, maxDaysAhead }} />
    </div>
  )
}
