'use server'

import { redirect } from 'next/navigation'
import type { FormState } from '@/components/ui'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { businessSchema, fieldErrors } from '@/lib/validation'

export async function createBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentUser()
  if (!user) redirect('/login')
  if (user.business) redirect('/dashboard')

  const parsed = businessSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fields: fieldErrors(parsed.error) }
  const data = parsed.data

  if (await db.business.findUnique({ where: { slug: data.slug }, select: { id: true } })) {
    return { fields: { slug: 'That link is taken — try another.' } }
  }

  await db.business.create({
    data: {
      ...data,
      ownerId: user.id,
      // Sensible defaults the owner can change: open Monday–Saturday, 10 AM–7 PM, and the owner as first staff member.
      workingHours: { create: [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, openMin: 10 * 60, closeMin: 19 * 60 })) },
      staff: { create: { name: user.name } },
    },
  })
  redirect('/dashboard/services?welcome=1')
}
