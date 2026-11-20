'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Spinner } from '@/components/ui'

export function CancelBookingButton({ code, token }: { code: string; token: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function cancel() {
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/bookings/${code}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => null)
    if (res?.ok) {
      router.refresh()
      return
    }
    const data = res ? ((await res.json().catch(() => ({}))) as { error?: string }) : {}
    setError(data.error ?? 'Could not cancel. Please try again.')
    setBusy(false)
  }

  return (
    <div className="flex-1">
      {confirming ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="mb-3 text-sm text-red-800">Cancel this booking? The time will be released for others.</p>
          <div className="flex gap-2">
            <button type="button" onClick={cancel} disabled={busy} className="btn-danger flex-1">
              {busy && <Spinner />} Yes, cancel it
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="btn-secondary flex-1">
              Keep booking
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="btn-danger w-full">
          Cancel booking
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  )
}
