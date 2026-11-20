import { NextResponse, type NextRequest } from 'next/server'
import { cancelBookingByCustomer } from '@/lib/booking'

export async function POST(request: NextRequest, ctx: RouteContext<'/api/bookings/[code]/cancel'>) {
  const { code } = await ctx.params
  const body = (await request.json().catch(() => ({}))) as { token?: unknown }
  if (typeof body.token !== 'string') return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  const result = await cancelBookingByCustomer(code, body.token)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}
