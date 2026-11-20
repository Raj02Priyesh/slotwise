import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from './lib/session-cookie'

// Fast redirect for signed-out visitors. Pages still verify the session itself (see requireBusiness).
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding'],
}
