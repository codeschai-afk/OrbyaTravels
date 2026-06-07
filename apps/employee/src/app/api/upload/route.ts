import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') return NextResponse.json({}, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Max 10MB' }, { status: 400 })
  if (!file.type.startsWith('image/'))  return NextResponse.json({ error: 'Images only' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const url    = await uploadImage(buffer, file.type, 'places')

  return NextResponse.json({ url, public_id: url })
}
