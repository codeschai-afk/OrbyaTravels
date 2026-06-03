import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@orbyatravel/db'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'No file provided' } }, { status: 400 })

  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: { code: 'FILE_TOO_LARGE', message: 'Max 10 MB' } }, { status: 413 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: { code: 'INVALID_TYPE', message: 'Images only' } }, { status: 415 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

  const result = await cloudinary.uploader.upload(base64, {
    folder: `orbyatravel/countries/${params.id}`,
    transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1400, crop: 'limit' }],
  })

  // Determine sort order
  const last = await prisma.countryImage.findFirst({
    where: { country_id: params.id },
    orderBy: { sort_order: 'desc' },
  })

  const image = await prisma.countryImage.create({
    data: {
      country_id: params.id,
      url:        result.secure_url,
      alt_text:   null,
      sort_order: (last?.sort_order ?? -1) + 1,
    },
  })

  return NextResponse.json({ data: image }, { status: 201 })
}
