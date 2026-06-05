import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const schema = z.object({
  role: z.enum(['CUSTOMER', 'PROVIDER', 'EMPLOYEE', 'ADMIN']),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({}, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: params.id },
    data:  { role: body.data.role },
    select: { id: true, email: true, role: true },
  })

  return NextResponse.json({ data: user })
}
