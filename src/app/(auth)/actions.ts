'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import type { FormState } from '@/components/ui'
import { db } from '@/lib/db'
import { createSession, destroySession } from '@/lib/session'
import { fieldErrors, loginSchema, signupSchema } from '@/lib/validation'

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fields: fieldErrors(parsed.error) }
  const { name, email, password } = parsed.data

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { fields: { email: 'An account with this email already exists. Try logging in.' } }
  }
  const user = await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  })
  await createSession(user.id)
  redirect('/onboarding')
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fields: fieldErrors(parsed.error) }
  const { email, password } = parsed.data

  const user = await db.user.findUnique({ where: { email } })
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: 'Incorrect email or password.' }
  }
  await createSession(user.id)
  redirect('/dashboard')
}

export async function logout() {
  await destroySession()
  redirect('/')
}
