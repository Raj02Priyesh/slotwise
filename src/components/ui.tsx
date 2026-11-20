'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold text-slate-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4M8.5 15l2.2 2.2L15.5 13" />
        </svg>
      </span>
      Slotwise
    </Link>
  )
}

/** Submit button that disables itself and shows progress while its form is pending. */
export function SubmitButton({ children, pendingText, className = 'btn-primary' }: { children: ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Spinner />}
      {pending ? (pendingText ?? children) : children}
    </button>
  )
}

export function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1.5 text-sm text-red-600" role="alert">
      {message}
    </p>
  )
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>
  if (success) return <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">{success}</p>
  return null
}

export function CopyButton({ text, label = 'Copy link' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          window.prompt('Copy this link:', text)
        }
      }}
    >
      {copied ? 'Copied ✓' : label}
    </button>
  )
}

export type FormState = { error?: string; success?: string; fields?: Record<string, string> } | undefined
