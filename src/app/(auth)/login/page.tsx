import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import { AuthForm } from '../AuthForm'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage() {
  if (await currentUser()) redirect('/dashboard')
  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 mb-6 text-slate-600">Log in to manage your bookings.</p>
      <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
        <strong>Try the demo:</strong> demo@slotwise.app / demo1234
      </div>
      <AuthForm mode="login" />
    </>
  )
}
