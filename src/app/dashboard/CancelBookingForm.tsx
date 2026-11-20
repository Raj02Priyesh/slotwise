'use client'

import { useState } from 'react'
import { SubmitButton } from '@/components/ui'
import { setBookingStatus } from './actions'

/** Owner-side cancel with an inline confirmation step. */
export function CancelBookingForm({ id, customer }: { id: string; customer: string }) {
  const [confirming, setConfirming] = useState(false)
  if (!confirming) {
    return (
      <button type="button" className="btn-danger" onClick={() => setConfirming(true)} aria-label={`Cancel booking for ${customer}`}>
        Cancel
      </button>
    )
  }
  return (
    <form action={setBookingStatus} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value="CANCELLED" />
      <SubmitButton className="btn-danger" pendingText="Cancelling…">Yes, cancel</SubmitButton>
      <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
        Keep
      </button>
    </form>
  )
}
