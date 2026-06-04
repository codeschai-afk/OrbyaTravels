import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@orbyatravel/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const isProd = process.env.NODE_ENV === 'production'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  cookies: isProd
    ? {
        sessionToken: {
          name: '__Secure-next-auth.session-token',
          options: { domain: '.orbyatravel.com', httpOnly: true, sameSite: 'lax', path: '/', secure: true },
        },
      }
    : undefined,
  providers: [
    Credentials({
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials) {
        try {
          const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(credentials)
          if (!parsed.success) return null
          const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
          if (!user?.password_hash || user.role !== 'EMPLOYEE') return null
          const valid = await bcrypt.compare(parsed.data.password, user.password_hash)
          if (!valid) return null
          return { id: user.id, email: user.email, name: user.name, role: user.role }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    },
  },
})
