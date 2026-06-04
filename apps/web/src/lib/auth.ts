import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
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
