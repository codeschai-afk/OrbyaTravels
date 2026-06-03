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

export async function DELETE(_req: Request, { params }: { params: { id: string; imageId: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })

  const image = await prisma.countryImage.findUnique({ where: { id: params.imageId } })
  if (!image) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })

  // Extract public_id from Cloudinary URL
  const urlParts = image.url.split('/')
  const fileWithExt = urlParts[urlParts.length - 1]
  const filename = fileWithExt.split('.')[0]
  const folderParts = urlParts.slice(urlParts.indexOf('upload') + 2, -1)
  const publicId = [...folderParts, filename].join('/')

  await Promise.all([
    prisma.countryImage.delete({ where: { id: params.imageId } }),
    cloudinary.uploader.destroy(publicId).catch(() => null), // don't fail if already gone
  ])

  return NextResponse.json({ data: { deleted: true } })
}
