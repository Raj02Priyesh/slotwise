import Link from 'next/link'
import { Logo } from '@/components/ui'
import { requireBusiness } from '@/lib/auth'
import { logout } from '../(auth)/actions'
import { DashboardNav } from './DashboardNav'

export default async function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  const { user, business } = await requireBusiness()
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Logo href="/dashboard" />
            <span className="hidden text-slate-300 sm:inline" aria-hidden="true">/</span>
            <span className="hidden font-medium text-slate-700 sm:inline">{business.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/book/${business.slug}`} target="_blank" className="btn-secondary">
              View booking page ↗
            </Link>
            <form action={logout}>
              <button type="submit" className="btn text-slate-600 hover:bg-slate-100" title={`Signed in as ${user.email}`}>
                Log out
              </button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2">
          <DashboardNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
