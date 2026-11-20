import { z } from 'zod'
import { isDateString } from './time'

export const RESERVED_SLUGS = new Set(['admin', 'api', 'book', 'dashboard', 'login', 'signup', 'onboarding', 'settings', 'new'])

const trimmed = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} is required`).max(max, `${label} is too long`)

export const signupSchema = z.object({
  name: trimmed(2, 80, 'Name'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use at least 3 characters')
  .max(40, 'Use at most 40 characters')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens')
  .refine((s) => !RESERVED_SLUGS.has(s), 'That link is reserved')

export const businessSchema = z.object({
  name: trimmed(2, 80, 'Business name'),
  slug: slugSchema,
  description: z.string().trim().max(300).default(''),
  phone: z.string().trim().max(30).default(''),
  address: z.string().trim().max(200).default(''),
  timezone: z.string().refine(isTimeZone, 'Unknown time zone'),
})

export const bookingRulesSchema = z.object({
  slotStepMin: z.coerce.number().int().refine((n) => [5, 10, 15, 20, 30, 60].includes(n), 'Pick a valid step'),
  minNoticeMin: z.coerce.number().int().min(0).max(60 * 24 * 7),
  maxDaysAhead: z.coerce.number().int().min(1).max(365),
})

export const serviceSchema = z.object({
  name: trimmed(2, 80, 'Service name'),
  description: z.string().trim().max(300).default(''),
  durationMin: z.coerce.number().int('Whole minutes only').min(5, 'At least 5 minutes').max(12 * 60, 'At most 12 hours'),
  price: z.coerce.number().int('Whole rupees only').min(0, 'Price can’t be negative').max(1_000_000),
})

export const staffSchema = z.object({ name: trimmed(2, 60, 'Name') })

/** Indian mobile (10 digits starting 6–9), optional +91 / 0 prefix and spaces. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}

export const bookingRequestSchema = z.object({
  serviceId: z.string().min(1),
  /** A staff id, or "any" to let the system assign someone free. */
  staffId: z.string().min(1),
  start: z.iso.datetime({ offset: true }),
  customerName: trimmed(2, 80, 'Name'),
  customerPhone: z
    .string()
    .transform((v, ctx) => {
      const phone = normalizePhone(v)
      if (!phone) ctx.addIssue({ code: 'custom', message: 'Enter a valid 10-digit mobile number' })
      return phone ?? ''
    }),
  customerEmail: z.union([z.literal(''), z.string().trim().toLowerCase().email('Enter a valid email')]).default(''),
  notes: z.string().trim().max(500).default(''),
})

export const availabilityQuerySchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1).default('any'),
  date: z.string().refine(isDateString, 'Use YYYY-MM-DD'),
})

export function isTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Turn a ZodError into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    out[key] ??= issue.message
  }
  return out
}
