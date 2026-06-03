import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = ['/', '/auth/signin', '/auth/signup', '/api/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Non-customers who somehow land here get sent to their portal
  const providerUrl = process.env.NEXT_PUBLIC_PROVIDER_URL ?? 'https://service.orbyatravel.com'
  const staffUrl    = process.env.NEXT_PUBLIC_STAFF_URL    ?? 'https://staff.orbyatravel.com'
  const adminUrl    = process.env.NEXT_PUBLIC_ADMIN_URL    ?? 'https://admin.orbyatravel.com'

  if (token.role === 'PROVIDER') return NextResponse.redirect(`${providerUrl}/listings`)
  if (token.role === 'EMPLOYEE') return NextResponse.redirect(`${staffUrl}/queue`)
  if (token.role === 'ADMIN')    return NextResponse.redirect(`${adminUrl}/`)

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
