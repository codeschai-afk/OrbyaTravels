import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note:   z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') return NextResponse.json({}, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { status, note } = body.data

  const profile = await prisma.providerProfile.update({
    where: { id: params.id },
    data: {
      verification_status: status,
      verification_note:   status === 'REJECTED' ? (note ?? null) : null,
    },
  })

  return NextResponse.json({ data: profile })
}
