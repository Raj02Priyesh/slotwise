# Slotwise

**Online appointment booking for salons, clinics, studios and other small service businesses.**
Every business gets its own booking page. Customers pick a service, a team member and a free time; the owner manages everything from a dashboard.

[![CI/CD](https://github.com/Raj02Priyesh/slotwise/actions/workflows/ci.yml/badge.svg)](https://github.com/Raj02Priyesh/slotwise/actions/workflows/ci.yml)

**Live demo:** _link added after deployment_
- Public booking page: `/book/velvet-vine`
- Owner dashboard: log in with `demo@slotwise.app` / `demo1234` (demo data is reset regularly)

## Features

**For customers**
- Choose a service, a specific team member or "anyone available", then a date and time
- Only genuinely free times are shown, using the business's hours, booking notice and each team member's existing bookings
- Instant confirmation page with a private link for viewing or cancelling the booking
- Works well on phones

**For business owners**
- Sign up and get a booking page at `/book/your-name` in under a minute
- Manage services (duration, price), team members and weekly opening hours
- Booking rules: time zone, start-time interval, minimum notice and how far ahead customers can book
- Dashboard of upcoming, past and cancelled bookings; cancel or mark appointments done

## How double bookings are prevented

Two customers can click the same time at the same moment. Instead of relying on a check-then-insert in application code, the database enforces it:

```sql
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_overlap"
  EXCLUDE USING gist ("staffId" WITH =, tstzrange("startAt", "endAt", '[)') WITH &&)
  WHERE (status <> 'CANCELLED');
```

When the request is for "anyone available", the server tries each free team member in turn and moves on if the constraint rejects one. An integration test fires 8 simultaneous requests at one slot and asserts exactly one booking is created.

## Tech stack

| Area | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 17 with Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Auth | Email and password (bcrypt), signed JWT session in an httpOnly cookie (`jose`) |
| Validation | Zod, shared by forms and the JSON API |
| Time zones | `date-fns` + `@date-fns/tz`; availability is computed in the business's own time zone |
| Tests | Vitest (unit + integration against real Postgres), Playwright (end-to-end, desktop and mobile) |
| Delivery | Docker (standalone build, migrations on start), GitHub Actions, GitHub Container Registry, Render |

## CI/CD

Every push and pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. Lint and type-check
2. Apply migrations to a Postgres service container
3. Unit and integration tests
4. Production build, demo seed, then Playwright end-to-end tests (report uploaded on failure)
5. Docker image build; on `main` the image is published to `ghcr.io/raj02priyesh/slotwise`

Render deploys `main` from the Dockerfile once the checks pass. The container runs `prisma migrate deploy` before starting, and `/api/health` checks the database connection.

## Run it locally

**Everything in Docker:**

```bash
docker compose up --build
# app on http://localhost:3000; then load demo data:
DATABASE_URL=postgresql://slotwise:slotwise@127.0.0.1:55432/slotwise npm run db:seed
```

**For development:**

```bash
npm install
docker compose up -d db
cp .env.example .env          # then set SESSION_SECRET
npm run db:migrate
npm run db:seed
npm run dev
```

**Tests:**

```bash
npm test                      # unit + integration (uses TEST_DATABASE_URL)
npm run build && npm run test:e2e
```

## Project structure

```
src/
  app/
    (auth)/            sign up, log in
    onboarding/        create the business
    dashboard/         bookings, services, team, hours, settings
    book/[slug]/       public booking page and booking confirmation
    api/               availability, bookings, cancel, health
  lib/
    slots.ts           pure availability algorithm (unit tested)
    booking.ts         booking rules and creation with conflict retry
    validation.ts      Zod schemas
    session.ts, auth.ts
  proxy.ts             redirects signed-out visitors away from the dashboard
prisma/                schema, migrations (incl. constraints), demo seed
tests/integration/     tests against a real database
e2e/                   Playwright tests
```

## Author

Built by [Priyesh Raj](https://raj02priyesh.github.io/), full-stack developer available for freelance work.
