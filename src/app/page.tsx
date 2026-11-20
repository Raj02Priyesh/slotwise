import Link from 'next/link'
import { Logo } from '@/components/ui'

const FEATURES = [
  { icon: '🔗', title: 'Your own booking page', text: 'Share one link on Instagram, WhatsApp or Google. Customers book in under a minute — no app, no account.' },
  { icon: '⏱️', title: 'Real-time availability', text: 'Only genuinely free times are shown, based on your hours, each service’s length and every team member’s calendar.' },
  { icon: '🛡️', title: 'No double bookings', text: 'Enforced by the database itself — even if two people tap the same slot at the same second, only one gets it.' },
  { icon: '👥', title: 'Built for teams', text: 'Each person has their own calendar. Customers pick someone or “anyone available”, and the next free person is assigned.' },
  { icon: '📅', title: 'Simple dashboard', text: 'See today and the week ahead, mark appointments done, cancel, and manage services, team and opening hours.' },
  { icon: '🌍', title: 'Time-zone aware', text: 'Every business runs in its own time zone, so slots are always right — wherever your customers are.' },
]

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn text-slate-700 hover:bg-slate-100">Log in</Link>
          <Link href="/signup" className="btn-primary">Get started</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-20 text-center sm:pt-20">
          <p className="mx-auto mb-5 inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">Online booking for salons, clinics, tutors & studios</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Let customers book you <span className="text-brand-600">24/7</span> — without the back-and-forth.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Slotwise gives your business a beautiful booking page with live availability, and a dashboard to manage every appointment.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/book/velvet-vine" className="btn-primary px-6 py-3 text-base">Try a live booking page</Link>
            <Link href="/signup" className="btn-secondary px-6 py-3 text-base">Create your own — free</Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Peek at the owner dashboard: log in with <span className="font-medium text-slate-700">demo@slotwise.app</span> / <span className="font-medium text-slate-700">demo1234</span>
          </p>
        </section>

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">Everything you need to take bookings</h2>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <li key={f.title} className="card p-6">
                  <span className="text-3xl" aria-hidden="true">{f.icon}</span>
                  <h3 className="mt-3 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold">Live in three steps</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              ['Create your page', 'Sign up and pick your link, like /book/your-salon.'],
              ['Add services & hours', 'Set what you offer, how long it takes, your team and opening hours.'],
              ['Share the link', 'Customers book themselves; you see everything in your dashboard.'],
            ].map(([title, text], i) => (
              <li key={title} className="text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 text-center">
            <Link href="/signup" className="btn-primary px-6 py-3 text-base">Get started</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        Slotwise is a portfolio project by{' '}
        <a href="https://raj02priyesh.github.io/" className="font-medium text-brand-700 hover:underline">Priyesh Raj</a> · demo data only, no real bookings or payments.
      </footer>
    </div>
  )
}
