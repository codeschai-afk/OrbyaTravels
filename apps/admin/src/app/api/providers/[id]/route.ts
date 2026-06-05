import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  is_verified: z.boolean().optional(),
  // Allow employee-style status updates too
  status: z.enum(['APPROVED', 'REJECTED']).optional(),
  note:   z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({}, { status: 401 })

  const { id } = await params
  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { is_verified, status, note } = body.data

  const updateData: Record<string, unknown> = {}

  if (typeof is_verified === 'boolean') {
    updateData.is_verified = is_verified
    updateData.verification_status = is_verified ? 'APPROVED' : 'PENDING'
  }

  if (status) {
    updateData.verification_status = status
    updateData.is_verified = status === 'APPROVED'
    if (status === 'REJECTED') updateData.verification_note = note ?? null
    if (status === 'APPROVED') updateData.verification_note = null
  }

  const profile = await prisma.providerProfile.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ data: profile })
}
