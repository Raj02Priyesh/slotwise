'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Spinner } from '@/components/ui'
import { formatDuration, formatPrice } from '@/lib/constants'
import { addDaysTo, formatDateLong, formatTimeIn, weekdayOf } from '@/lib/time'

type Service = { id: string; name: string; description: string; durationMin: number; price: number }
type Staff = { id: string; name: string }
type Slot = { start: string; end: string }

const REASONS: Record<string, string> = {
  closed: 'Closed on this day - please pick another date.',
  past: 'This date has passed.',
  'too-far': 'This date is too far ahead.',
}

export function BookingWidget(props: {
  slug: string
  timezone: string
  today: string
  maxDaysAhead: number
  openWeekdays: number[]
  services: Service[]
  staff: Staff[]
}) {
  const { slug, timezone, today, maxDaysAhead, openWeekdays, services, staff } = props
  const router = useRouter()

  const days = useMemo(() => Array.from({ length: Math.min(maxDaysAhead, 30) + 1 }, (_, i) => addDaysTo(today, i)), [today, maxDaysAhead])
  const firstOpen = days.find((d) => openWeekdays.includes(weekdayOf(d))) ?? today

  const [serviceId, setServiceId] = useState(services.length === 1 ? services[0].id : '')
  const [staffId, setStaffId] = useState('any')
  const [date, setDate] = useState(firstOpen)
  const [reload, setReload] = useState(0)
  // Results and the chosen time are tied to the query they belong to, so changing
  // service, staff or date shows a spinner and clears the time without extra effects.
  const [result, setResult] = useState<{ key: string; slots: Slot[]; reason: string | null } | null>(null)
  const [picked, setPicked] = useState<{ key: string; start: string } | null>(null)
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', notes: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const service = services.find((s) => s.id === serviceId)

  const query = serviceId ? `${new URLSearchParams({ serviceId, staffId, date })}#${reload}` : null
  const loadingSlots = query !== null && result?.key !== query
  const slots = result && result.key === query ? result.slots : null
  const reason = result && result.key === query ? result.reason : null
  const start = picked && picked.key === query ? picked.start : null
  const setStart = (value: string | null) => setPicked(value && query ? { key: query, start: value } : null)

  useEffect(() => {
    if (!query) return
    let cancelled = false
    const qs = query.slice(0, query.lastIndexOf('#'))
    fetch(`/api/book/${slug}/availability?${qs}`, { cache: 'no-store' })
      .then((res) => res.json() as Promise<{ slots?: Slot[]; reason?: string }>)
      .then(
        (data) => !cancelled && setResult({ key: query, slots: data.slots ?? [], reason: data.reason ?? null }),
        () => !cancelled && setResult({ key: query, slots: [], reason: 'network' }),
      )
    return () => {
      cancelled = true
    }
  }, [slug, query])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!start || !serviceId) return
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      const res = await fetch(`/api/book/${slug}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, staffId, start, ...form }),
      })
      const data = (await res.json()) as { code?: string; token?: string; error?: string; fields?: Record<string, string> }
      if (res.ok && data.code && data.token) {
        router.push(`/book/${slug}/b/${data.code}?t=${encodeURIComponent(data.token)}`)
        return
      }
      setError(data.error ?? 'Something went wrong. Please try again.')
      setFieldErrors(data.fields ?? {})
      if (res.status === 409) {
        setReload((r) => r + 1)
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    }
    setSubmitting(false)
  }

  const step = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white'

  return (
    <div className="space-y-6">
      {/* 1. Service */}
      <section className="card p-5 sm:p-6" aria-labelledby="step-service">
        <h2 id="step-service" className="mb-4 flex items-center gap-3 text-lg font-semibold">
          <span className={step}>1</span> Choose a service
        </h2>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Service">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={serviceId === s.id}
              onClick={() => setServiceId(s.id)}
              className={`rounded-lg border p-4 text-left transition ${serviceId === s.id ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-brand-300'}`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-medium">{s.name}</span>
                <span className="shrink-0 font-semibold text-brand-700">{formatPrice(s.price)}</span>
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {formatDuration(s.durationMin)}
                {s.description && <> · {s.description}</>}
              </span>
            </button>
          ))}
        </div>
      </section>

      {serviceId && (
        <>
          {/* 2. Staff */}
          {staff.length > 1 && (
            <section className="card p-5 sm:p-6" aria-labelledby="step-staff">
              <h2 id="step-staff" className="mb-4 flex items-center gap-3 text-lg font-semibold">
                <span className={step}>2</span> With whom?
              </h2>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Team member">
                {[{ id: 'any', name: 'Anyone available' }, ...staff].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={staffId === p.id}
                    onClick={() => setStaffId(p.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${staffId === p.id ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white hover:border-brand-400'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 3. Date & time */}
          <section className="card p-5 sm:p-6" aria-labelledby="step-time">
            <h2 id="step-time" className="mb-4 flex items-center gap-3 text-lg font-semibold">
              <span className={step}>{staff.length > 1 ? 3 : 2}</span> Pick a time
            </h2>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="radiogroup" aria-label="Date">
              {days.map((d) => {
                const open = openWeekdays.includes(weekdayOf(d))
                const [, , dd] = d.split('-')
                const label = formatDateLong(d)
                return (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={date === d}
                    aria-label={`${label}${open ? '' : ' (closed)'}`}
                    disabled={!open}
                    onClick={() => setDate(d)}
                    className={`flex w-16 shrink-0 flex-col items-center rounded-lg border py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      date === d ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white hover:border-brand-400'
                    }`}
                  >
                    <span className="text-xs uppercase opacity-80">{label.slice(0, 3)}</span>
                    <span className="text-lg font-semibold">{Number(dd)}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 mb-3 text-sm text-slate-500">
              {formatDateLong(date)} · times shown in {timezone.replace('_', ' ')}
            </p>
            {loadingSlots ? (
              <p className="flex items-center gap-2 py-6 text-slate-500"><Spinner /> Checking availability…</p>
            ) : slots && slots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Time">
                {slots.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    role="radio"
                    aria-checked={start === s.start}
                    onClick={() => setStart(s.start)}
                    className={`rounded-lg border py-2 text-sm font-medium transition ${start === s.start ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white hover:border-brand-400'}`}
                  >
                    {formatTimeIn(new Date(s.start), timezone)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                {reason === 'network' ? 'Couldn’t load times. Please try again.' : (reason && REASONS[reason]) ?? 'No free times left on this day - try another date.'}
              </p>
            )}
          </section>

          {/* 4. Details */}
          {start && service && (
            <section className="card p-5 sm:p-6" aria-labelledby="step-details">
              <h2 id="step-details" className="mb-1 flex items-center gap-3 text-lg font-semibold">
                <span className={step}>{staff.length > 1 ? 4 : 3}</span> Your details
              </h2>
              <p className="mb-4 ml-10 text-sm text-slate-600">
                {service.name} · {formatDateLong(date)} at {formatTimeIn(new Date(start), timezone)} · {formatPrice(service.price)}
              </p>
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
                {(
                  [
                    ['customerName', 'Your name', 'text', 'name', true],
                    ['customerPhone', 'Mobile number', 'tel', 'tel', true],
                    ['customerEmail', 'Email (optional)', 'email', 'email', false],
                  ] as const
                ).map(([key, label, type, autoComplete, required]) => (
                  <div key={key}>
                    <label htmlFor={key} className="label">{label}</label>
                    <input
                      id={key}
                      type={type}
                      autoComplete={autoComplete}
                      required={required}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="input"
                      aria-invalid={!!fieldErrors[key]}
                      aria-describedby={fieldErrors[key] ? `${key}-error` : undefined}
                    />
                    {fieldErrors[key] && <p id={`${key}-error`} className="mt-1.5 text-sm text-red-600" role="alert">{fieldErrors[key]}</p>}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="label">Notes (optional)</label>
                  <textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
                </div>
                {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2" role="alert">{error}</p>}
                <div className="sm:col-span-2">
                  <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
                    {submitting && <Spinner />} {submitting ? 'Booking…' : 'Confirm booking'}
                  </button>
                  <p className="mt-2 text-center text-xs text-slate-500">No payment needed now - pay at your appointment.</p>
                </div>
              </form>
            </section>
          )}
        </>
      )}
    </div>
  )
}
