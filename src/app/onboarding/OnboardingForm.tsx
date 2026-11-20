'use client'

import { useActionState, useState } from 'react'
import { FieldError, SubmitButton, type FormState } from '@/components/ui'
import { TIMEZONES } from '@/lib/constants'
import { createBusiness } from './actions'

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

export function OnboardingForm() {
  const [state, action] = useActionState<FormState, FormData>(createBusiness, undefined)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const f = state?.fields ?? {}
  const shownSlug = slugTouched ? slug : slugify(name)

  return (
    <form action={action} className="space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="label">Business name</label>
        <input id="name" name="name" required className="input" placeholder="e.g. Velvet & Vine Salon" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!f.name} />
        <FieldError id="name-error" message={f.name} />
      </div>
      <div>
        <label htmlFor="slug" className="label">Your booking link</label>
        <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
          <span className="flex items-center bg-slate-50 px-3 text-sm text-slate-500">slotwise/book/</span>
          <input
            id="slug"
            name="slug"
            required
            className="min-w-0 flex-1 px-3 py-2.5 focus:outline-none"
            value={shownSlug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(slugify(e.target.value))
            }}
            aria-invalid={!!f.slug}
          />
        </div>
        <FieldError id="slug-error" message={f.slug} />
      </div>
      <div>
        <label htmlFor="description" className="label">Short description <span className="font-normal text-slate-400">(optional)</span></label>
        <textarea id="description" name="description" rows={2} className="input" placeholder="Hair, skin and nails in Koramangala" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="label">Phone <span className="font-normal text-slate-400">(optional)</span></label>
          <input id="phone" name="phone" type="tel" className="input" />
        </div>
        <div>
          <label htmlFor="timezone" className="label">Time zone</label>
          <select id="timezone" name="timezone" className="input" defaultValue="Asia/Kolkata">
            {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="address" className="label">Address <span className="font-normal text-slate-400">(optional)</span></label>
        <input id="address" name="address" className="input" />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Creating…">Create my booking page</SubmitButton>
    </form>
  )
}
