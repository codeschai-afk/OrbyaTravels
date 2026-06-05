import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') return NextResponse.json({}, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const MAX_MB = 10
  if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: `Max ${MAX_MB}MB` }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Images only' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'orbyatravel/providers',
    transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1400, crop: 'limit' }],
  })

  return NextResponse.json({ url: result.secure_url, public_id: result.public_id })
}
