import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  name:            z.string().min(2),
  iso_code:        z.string().length(2).toUpperCase(),
  slug:            z.string().min(2).regex(/^[a-z0-9-]+$/),
  description:     z.string().optional(),
  travel_advisory: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).default('NONE'),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, { status: 400 })

  const country = await prisma.country.create({ data: parsed.data })
  return NextResponse.json({ data: country }, { status: 201 })
}
