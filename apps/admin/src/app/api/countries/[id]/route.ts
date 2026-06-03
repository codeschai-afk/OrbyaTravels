import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  name:            z.string().min(2).optional(),
  iso_code:        z.string().length(2).toUpperCase().optional(),
  slug:            z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description:     z.string().optional(),
  travel_advisory: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  is_active:       z.boolean().optional(),
  is_featured:     z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR' } }, { status: 400 })

  const country = await prisma.country.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json({ data: country })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })

  await prisma.country.delete({ where: { id: params.id } })
  return NextResponse.json({ data: { deleted: true } })
}
