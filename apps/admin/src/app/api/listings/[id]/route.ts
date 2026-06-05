import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  approval_status: z.enum(['APPROVED', 'REJECTED', 'FLAGGED', 'PENDING']),
  rejection_reason: z.string().optional(),
  flagged_reason: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({}, { status: 401 })

  const { id } = await params
  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const listing = await prisma.listing.update({
    where: { id },
    data: {
      approval_status: body.data.approval_status,
      rejection_reason: body.data.rejection_reason ?? null,
      flagged_reason: body.data.flagged_reason ?? null,
    },
  })

  return NextResponse.json({ data: listing })
}
