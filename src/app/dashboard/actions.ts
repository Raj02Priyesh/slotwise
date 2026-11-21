'use server'

import { revalidatePath } from 'next/cache'
import type { FormState } from '@/components/ui'
import { requireBusiness } from '@/lib/auth'
import { db } from '@/lib/db'
import { hhmmToMinutes } from '@/lib/time'
import { bookingRulesSchema, businessSchema, fieldErrors, serviceSchema, staffSchema } from '@/lib/validation'

// Every action re-checks the session and scopes writes to the owner's own business.

export async function saveService(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness()
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fields: fieldErrors(parsed.error) }
  const id = formData.get('id')
  if (typeof id === 'string' && id) {
    const { count } = await db.service.updateMany({ where: { id, businessId: business.id }, data: parsed.data })
    if (!count) return { error: 'Service not found.' }
  } else {
    await db.service.create({ data: { ...parsed.data, businessId: business.id } })
  }
  revalidatePath('/dashboard', 'layout')
  return { success: id ? 'Service updated.' : 'Service added.' }
}

export async function toggleService(formData: FormData) {
  const { business } = await requireBusiness()
  const id = String(formData.get('id'))
  const active = formData.get('active') === 'true'
  await db.service.updateMany({ where: { id, businessId: business.id }, data: { active } })
  revalidatePath('/dashboard', 'layout')
}

export async function saveStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness()
  const parsed = staffSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fields: fieldErrors(parsed.error) }
  await db.staff.create({ data: { ...parsed.data, businessId: business.id } })
  revalidatePath('/dashboard', 'layout')
  return { success: 'Team member added.' }
}

export async function toggleStaff(formData: FormData) {
  const { business } = await requireBusiness()
  const id = String(formData.get('id'))
  const active = formData.get('active') === 'true'
  if (!active) {
    const activeCount = await db.staff.count({ where: { businessId: business.id, active: true } })
    if (activeCount <= 1) return // keep at least one bookable person
  }
  await db.staff.updateMany({ where: { id, businessId: business.id }, data: { active } })
  revalidatePath('/dashboard', 'layout')
}

export async function saveHours(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness()
  const rows: { weekday: number; openMin: number; closeMin: number }[] = []
  const errors: Record<string, string> = {}
  for (let d = 0; d < 7; d++) {
    if (formData.get(`open-${d}`) !== 'on') continue
    const openMin = hhmmToMinutes(String(formData.get(`from-${d}`) ?? ''))
    const closeMin = hhmmToMinutes(String(formData.get(`to-${d}`) ?? ''))
    if (openMin === null || closeMin === null || closeMin <= openMin) {
      errors[`day-${d}`] = 'Closing time must be after opening time.'
      continue
    }
    rows.push({ weekday: d, openMin, closeMin })
  }
  if (Object.keys(errors).length) return { fields: errors, error: 'Please fix the highlighted days.' }

  await db.$transaction([
    db.workingHours.deleteMany({ where: { businessId: business.id } }),
    db.workingHours.createMany({ data: rows.map((r) => ({ ...r, businessId: business.id })) }),
  ])
  revalidatePath('/dashboard', 'layout')
  return { success: rows.length ? 'Opening hours saved.' : 'Saved - you’re now closed every day, so customers can’t book.' }
}

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness()
  const raw = Object.fromEntries(formData)
  const profile = businessSchema.safeParse(raw)
  const rules = bookingRulesSchema.safeParse(raw)
  if (!profile.success || !rules.success) {
    return { fields: { ...(profile.success ? {} : fieldErrors(profile.error)), ...(rules.success ? {} : fieldErrors(rules.error)) } }
  }
  if (profile.data.slug !== business.slug) {
    const taken = await db.business.findUnique({ where: { slug: profile.data.slug }, select: { id: true } })
    if (taken) return { fields: { slug: 'That link is taken - try another.' } }
  }
  await db.business.update({ where: { id: business.id }, data: { ...profile.data, ...rules.data } })
  revalidatePath('/dashboard', 'layout')
  return { success: 'Settings saved.' }
}

export async function setBookingStatus(formData: FormData) {
  const { business } = await requireBusiness()
  const id = String(formData.get('id'))
  const status = String(formData.get('status'))
  // Only forward transitions: re-confirming a cancelled booking could clash with a newer booking for that slot.
  if (status !== 'CANCELLED' && status !== 'COMPLETED') return
  await db.booking.updateMany({ where: { id, businessId: business.id, status: 'CONFIRMED' }, data: { status } })
  revalidatePath('/dashboard', 'layout')
}
