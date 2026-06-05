import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Paths that REQUIRE authentication
const PROTECTED_PREFIXES = ['/bookings', '/profile', '/trips']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Auth routes always allowed
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // Only enforce auth on explicitly protected paths
  const needsAuth = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (needsAuth && !token) {
    const url = new URL('/auth/signin', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect non-customer roles to their own portals
  if (token) {
    const providerUrl = process.env.NEXT_PUBLIC_PROVIDER_URL ?? 'http://localhost:3001'
    const staffUrl    = process.env.NEXT_PUBLIC_STAFF_URL    ?? 'http://localhost:3002'
    const adminUrl    = process.env.NEXT_PUBLIC_ADMIN_URL    ?? 'http://localhost:3003'

    if (token.role === 'PROVIDER') return NextResponse.redirect(`${providerUrl}/listings`)
    if (token.role === 'EMPLOYEE') return NextResponse.redirect(`${staffUrl}/queue`)
    if (token.role === 'ADMIN')    return NextResponse.redirect(`${adminUrl}/`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
