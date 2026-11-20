'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { FieldError, FormMessage, SubmitButton, type FormState } from '@/components/ui'
import { SLOT_STEPS, TIMEZONES } from '@/lib/constants'
import { minutesToHHMM, WEEKDAYS } from '@/lib/time'
import { saveHours, saveService, saveSettings, saveStaff } from './actions'

type ServiceValues = { id?: string; name: string; description: string; durationMin: number; price: number }

/** Add a new service, or edit an existing one (pass `initial`). */
export function ServiceForm({ initial, onDone }: { initial?: ServiceValues; onDone?: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(saveService, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  const f = state?.fields ?? {}
  const prefix = initial?.id ?? 'new'

  useEffect(() => {
    if (state?.success) {
      if (!initial) formRef.current?.reset()
      onDone?.()
    }
  }, [state, initial, onDone])

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-6" noValidate>
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="sm:col-span-3">
        <label htmlFor={`${prefix}-name`} className="label">Service name</label>
        <input id={`${prefix}-name`} name="name" defaultValue={initial?.name} className="input" placeholder="e.g. Haircut & style" aria-invalid={!!f.name} />
        <FieldError id={`${prefix}-name-error`} message={f.name} />
      </div>
      <div className="sm:col-span-1">
        <label htmlFor={`${prefix}-duration`} className="label">Minutes</label>
        <input id={`${prefix}-duration`} name="durationMin" type="number" min={5} step={5} defaultValue={initial?.durationMin ?? 30} className="input" aria-invalid={!!f.durationMin} />
        <FieldError id={`${prefix}-duration-error`} message={f.durationMin} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${prefix}-price`} className="label">Price (₹)</label>
        <input id={`${prefix}-price`} name="price" type="number" min={0} defaultValue={initial?.price ?? 500} className="input" aria-invalid={!!f.price} />
        <FieldError id={`${prefix}-price-error`} message={f.price} />
      </div>
      <div className="sm:col-span-6">
        <label htmlFor={`${prefix}-description`} className="label">Description <span className="font-normal text-slate-400">(optional)</span></label>
        <input id={`${prefix}-description`} name="description" defaultValue={initial?.description} className="input" placeholder="What's included" />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-6">
        <SubmitButton pendingText="Saving…">{initial ? 'Save changes' : 'Add service'}</SubmitButton>
        {onDone && initial && <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>}
        <FormMessage error={state?.error} success={state?.success} />
      </div>
    </form>
  )
}

export function EditServiceToggle({ service }: { service: ServiceValues }) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>Edit</button>
  }
  return (
    <div className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 p-4">
      <ServiceForm initial={service} onDone={() => setOpen(false)} />
    </div>
  )
}

export function StaffForm() {
  const [state, action] = useActionState<FormState, FormData>(saveStaff, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])
  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-start gap-3" noValidate>
      <div className="min-w-56 flex-1">
        <label htmlFor="staff-name" className="sr-only">Team member name</label>
        <input id="staff-name" name="name" className="input" placeholder="Full name" aria-invalid={!!state?.fields?.name} />
        <FieldError id="staff-name-error" message={state?.fields?.name} />
      </div>
      <SubmitButton pendingText="Adding…">Add team member</SubmitButton>
      <FormMessage success={state?.success} />
    </form>
  )
}

export function HoursForm({ hours }: { hours: { weekday: number; openMin: number; closeMin: number }[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveHours, undefined)
  const [open, setOpen] = useState(() => new Set(hours.map((h) => h.weekday)))
  const order = [1, 2, 3, 4, 5, 6, 0]
  return (
    <form action={action} className="space-y-4">
      <ul className="card divide-y divide-slate-100">
        {order.map((d) => {
          const row = hours.find((h) => h.weekday === d)
          const isOpen = open.has(d)
          const error = state?.fields?.[`day-${d}`]
          return (
            <li key={d} className="flex flex-wrap items-center gap-4 p-4">
              <label className="flex w-36 items-center gap-3 font-medium">
                <input
                  type="checkbox"
                  name={`open-${d}`}
                  checked={isOpen}
                  onChange={(e) => {
                    const next = new Set(open)
                    if (e.target.checked) next.add(d)
                    else next.delete(d)
                    setOpen(next)
                  }}
                  className="h-4 w-4 accent-brand-600"
                />
                {WEEKDAYS[d]}
              </label>
              {isOpen ? (
                <div className="flex items-center gap-2">
                  <input type="time" name={`from-${d}`} defaultValue={minutesToHHMM(row?.openMin ?? 600)} className="input w-32" aria-label={`${WEEKDAYS[d]} opening time`} aria-invalid={!!error} />
                  <span className="text-slate-400">to</span>
                  <input type="time" name={`to-${d}`} defaultValue={minutesToHHMM(row?.closeMin ?? 1140)} className="input w-32" aria-label={`${WEEKDAYS[d]} closing time`} aria-invalid={!!error} />
                </div>
              ) : (
                <span className="text-sm text-slate-400">Closed</span>
              )}
              {error && <p className="w-full text-sm text-red-600" role="alert">{error}</p>}
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Saving…">Save hours</SubmitButton>
        <FormMessage error={state?.error} success={state?.success} />
      </div>
    </form>
  )
}

type Settings = {
  name: string
  slug: string
  description: string
  phone: string
  address: string
  timezone: string
  slotStepMin: number
  minNoticeMin: number
  maxDaysAhead: number
}

export function SettingsForm({ values }: { values: Settings }) {
  const [state, action] = useActionState<FormState, FormData>(saveSettings, undefined)
  const f = state?.fields ?? {}
  const field = (name: keyof Settings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`s-${name}`} className="label">{label}</label>
      <input id={`s-${name}`} name={name} defaultValue={String(values[name])} className="input" aria-invalid={!!f[name]} {...props} />
      <FieldError id={`s-${name}-error`} message={f[name]} />
    </div>
  )
  return (
    <form action={action} className="space-y-8" noValidate>
      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold">Business profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('name', 'Business name')}
          {field('slug', 'Booking link (slotwise/book/…)')}
        </div>
        {field('description', 'Short description')}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('phone', 'Phone', { type: 'tel' })}
          <div>
            <label htmlFor="s-timezone" className="label">Time zone</label>
            <select id="s-timezone" name="timezone" defaultValue={values.timezone} className="input">
              {(TIMEZONES.includes(values.timezone) ? TIMEZONES : [values.timezone, ...TIMEZONES]).map((tz) => <option key={tz}>{tz}</option>)}
            </select>
          </div>
        </div>
        {field('address', 'Address')}
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold">Booking rules</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="s-step" className="label">Start times every</label>
            <select id="s-step" name="slotStepMin" defaultValue={values.slotStepMin} className="input">
              {SLOT_STEPS.map((n) => <option key={n} value={n}>{n} minutes</option>)}
            </select>
          </div>
          {field('minNoticeMin', 'Minimum notice (minutes)', { type: 'number', min: 0 })}
          {field('maxDaysAhead', 'Book up to (days ahead)', { type: 'number', min: 1, max: 365 })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
        <FormMessage error={state?.error} success={state?.success} />
      </div>
    </form>
  )
}
