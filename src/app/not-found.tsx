import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The link may be mistyped, or this booking page no longer exists.</p>
      <Link href="/" className="btn-primary mt-6">Go to Slotwise</Link>
    </main>
  )
}
