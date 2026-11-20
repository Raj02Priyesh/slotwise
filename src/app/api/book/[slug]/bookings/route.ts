import { NextResponse, type NextRequest } from 'next/server'
import { createBooking } from '@/lib/booking'

export async function POST(request: NextRequest, ctx: RouteContext<'/api/book/[slug]/bookings'>) {
  const { slug } = await ctx.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const result = await createBooking(slug, (body ?? {}) as Parameters<typeof createBooking>[1])
  if (!result.ok) return NextResponse.json({ error: result.error, fields: result.fields }, { status: result.status })
  return NextResponse.json({ code: result.code, token: result.cancelToken }, { status: 201 })
}
