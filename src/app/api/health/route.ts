import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Used by Render's health check and the Docker HEALTHCHECK.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, db: 'up' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 })
  }
}
