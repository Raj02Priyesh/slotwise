import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { db } from './db'
import { readSession } from './session'

/** The signed-in user (with their business), or null. Cached per request. */
export const currentUser = cache(async () => {
  const userId = await readSession()
  if (!userId) return null
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, business: true },
  })
})

/** For dashboard pages: the signed-in owner's business, redirecting if needed. */
export async function requireBusiness() {
  const user = await currentUser()
  if (!user) redirect('/login')
  if (!user.business) redirect('/onboarding')
  return { user, business: user.business }
}
