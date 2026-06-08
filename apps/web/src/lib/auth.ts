import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@orbyatravel/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const isProd = process.env.NODE_ENV === 'production'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  // Share session cookie across all *.orbyatravel.com subdomains in production
  cookies: isProd
    ? {
        sessionToken: {
          name: '__Secure-next-auth.session-token',
          options: {
            domain: '.orbyatravel.com',
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: true,
          },
        },
      }
    : undefined,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allow users who registered with email/password to also sign in with Google
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user?.password_hash) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password_hash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Block ADMIN and EMPLOYEE from using Google OAuth — they must use credentials
      if (account?.provider === 'google' && profile?.email) {
        const existing = await prisma.user.findUnique({
          where: { email: profile.email },
          select: { role: true },
        })
        if (existing && ['ADMIN', 'EMPLOYEE'].includes(existing.role)) {
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        // Credentials provider sets role directly; for Google it may be undefined
        if ('role' in user) token.role = user.role
      }
      // Fetch role from DB on first Google sign-in (not set by OAuth provider)
      if (account?.provider === 'google' && token.id && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        if (dbUser) token.role = dbUser.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    },
  },
})

/** URL each role should land on after sign-in */
export function roleRedirectUrl(role: string): string {
  const provider = process.env.NEXT_PUBLIC_PROVIDER_URL ?? 'https://service.orbyatravel.com'
  const staff = process.env.NEXT_PUBLIC_STAFF_URL ?? 'https://staff.orbyatravel.com'
  const admin = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.orbyatravel.com'

  switch (role) {
    case 'PROVIDER': return `${provider}/listings`
    case 'EMPLOYEE': return `${staff}/queue`
    case 'ADMIN':    return `${admin}/`
    default:         return '/trips'
  }
}
