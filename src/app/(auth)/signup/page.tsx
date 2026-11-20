import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import { AuthForm } from '../AuthForm'

export const metadata: Metadata = { title: 'Create your account' }

export default async function SignupPage() {
  if (await currentUser()) redirect('/dashboard')
  return (
    <>
      <h1 className="text-2xl font-bold">Start taking bookings</h1>
      <p className="mt-1 mb-6 text-slate-600">Free to try. Set up your booking page in about two minutes.</p>
      <AuthForm mode="signup" />
    </>
  )
}
