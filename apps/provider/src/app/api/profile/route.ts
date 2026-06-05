import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import { z } from 'zod'

const createSchema = z.object({
  business_name:       z.string().min(2),
  contact_email:       z.string().email(),
  contact_phone:       z.string().optional(),
  website:             z.string().url().optional().or(z.literal('')),
  description:         z.string().optional(),
  service_types:       z.array(z.string()).min(1, 'Select at least one service type'),
  business_type:       z.enum(['PERSONAL', 'VAT_REGISTERED', 'PAN_REGISTERED']),
  registration_number: z.string().optional(),
  city:                z.string().min(2),
  area:                z.string().optional(),
  zip_code:            z.string().optional(),
  latitude:            z.number().optional(),
  longitude:           z.number().optional(),
  photos:              z.array(z.object({ url: z.string().url(), cloudinary_id: z.string().optional() })).min(2).max(7),
})

const patchSchema = createSchema.partial().extend({
  photos: z.array(z.object({ url: z.string().url(), cloudinary_id: z.string().optional() })).min(2).max(7).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') return NextResponse.json({}, { status: 401 })

  const profile = await prisma.providerProfile.findUnique({
    where: { user_id: session.user.id },
    include: { photos: { orderBy: { sort_order: 'asc' } } },
  })
  return NextResponse.json({ data: profile })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') return NextResponse.json({}, { status: 401 })

  const body = createSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const existing = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (existing) return NextResponse.json({ error: 'Profile already exists' }, { status: 409 })

  const { photos, ...profileData } = body.data

  const profile = await prisma.$transaction(async (tx) => {
    const p = await tx.providerProfile.create({
      data: { ...profileData, user_id: session.user.id, verification_status: 'PENDING' },
    })
    if (photos?.length) {
      await tx.providerImage.createMany({
        data: photos.map((img, i) => ({ provider_id: p.id, url: img.url, cloudinary_id: img.cloudinary_id, sort_order: i })),
      })
    }
    return p
  })

  return NextResponse.json({ data: profile }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') return NextResponse.json({}, { status: 401 })

  const body = patchSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { photos, ...profileData } = body.data

  const profile = await prisma.$transaction(async (tx) => {
    const p = await tx.providerProfile.update({
      where: { user_id: session.user.id },
      data: { ...profileData, verification_status: 'PENDING', verification_note: null },
    })
    if (photos) {
      await tx.providerImage.deleteMany({ where: { provider_id: p.id } })
      await tx.providerImage.createMany({
        data: photos.map((img, i) => ({ provider_id: p.id, url: img.url, cloudinary_id: img.cloudinary_id, sort_order: i })),
      })
    }
    return p
  })

  return NextResponse.json({ data: profile })
}
