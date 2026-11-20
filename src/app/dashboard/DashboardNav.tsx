'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/dashboard', label: 'Bookings' },
  { href: '/dashboard/services', label: 'Services' },
  { href: '/dashboard/staff', label: 'Team' },
  { href: '/dashboard/hours', label: 'Hours' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export function DashboardNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Dashboard" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1">
        {LINKS.map((l) => {
          const active = l.href === '/dashboard' ? pathname === l.href : pathname.startsWith(l.href)
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {l.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
