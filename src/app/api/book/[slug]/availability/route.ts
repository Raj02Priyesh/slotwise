import { NextResponse, type NextRequest } from 'next/server'
import { getAvailability, getPublicBusiness } from '@/lib/booking'
import { availabilityQuerySchema } from '@/lib/validation'

export async function GET(request: NextRequest, ctx: RouteContext<'/api/book/[slug]/availability'>) {
  const { slug } = await ctx.params
  const query = availabilityQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!query.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const business = await getPublicBusiness(slug)
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const result = await getAvailability(business, query.data.serviceId, query.data.staffId, query.data.date)
  if (!result.ok) {
    return NextResponse.json({ slots: [], reason: result.reason }, { status: result.reason === 'not-found' ? 404 : 200 })
  }
  return NextResponse.json(
    { slots: result.slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
