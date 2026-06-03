import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = ['/auth/signin', '/api/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const consumerUrl = process.env.NEXT_PUBLIC_CONSUMER_URL ?? 'https://orbyatravel.com'

  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  if (token.role !== 'PROVIDER') {
    return NextResponse.redirect(`${consumerUrl}/auth/signin`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
