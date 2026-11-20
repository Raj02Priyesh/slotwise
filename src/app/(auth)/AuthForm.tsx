'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { FieldError, FormMessage, SubmitButton, type FormState } from '@/components/ui'
import { login, signup } from './actions'

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [state, action] = useActionState<FormState, FormData>(mode === 'login' ? login : signup, undefined)
  const f = state?.fields ?? {}
  const invalid = (k: string) => (f[k] ? { 'aria-invalid': true, 'aria-describedby': `${k}-error` } : {})

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage error={state?.error} />
      {mode === 'signup' && (
        <div>
          <label htmlFor="name" className="label">Your name</label>
          <input id="name" name="name" autoComplete="name" required className="input" {...invalid('name')} />
          <FieldError id="name-error" message={f.name} />
        </div>
      )}
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" {...invalid('email')} />
        <FieldError id="email-error" message={f.email} />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={mode === 'signup' ? 8 : undefined}
          className="input"
          {...invalid('password')}
        />
        <FieldError id="password-error" message={f.password} />
        {mode === 'signup' && !f.password && <p className="mt-1.5 text-xs text-slate-500">At least 8 characters.</p>}
      </div>
      <SubmitButton className="btn-primary w-full" pendingText={mode === 'login' ? 'Logging in…' : 'Creating account…'}>
        {mode === 'login' ? 'Log in' : 'Create account'}
      </SubmitButton>
      <p className="text-center text-sm text-slate-600">
        {mode === 'login' ? (
          <>New to Slotwise? <Link href="/signup" className="font-semibold text-brand-700 hover:underline">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link></>
        )}
      </p>
    </form>
  )
}
