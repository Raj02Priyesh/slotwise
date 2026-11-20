import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/ui'
import { currentUser } from '@/lib/auth'
import { OnboardingForm } from './OnboardingForm'

export const metadata: Metadata = { title: 'Set up your business' }

export default async function OnboardingPage() {
  const user = await currentUser()
  if (!user) redirect('/login')
  if (user.business) redirect('/dashboard')

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6 sm:p-8">
          <p className="text-sm font-semibold text-brand-700">Step 1 of 2</p>
          <h1 className="mt-1 text-2xl font-bold">Tell us about your business</h1>
          <p className="mt-1 mb-6 text-slate-600">This appears on your public booking page. You can change it later.</p>
          <OnboardingForm />
        </div>
      </div>
    </main>
  )
}
