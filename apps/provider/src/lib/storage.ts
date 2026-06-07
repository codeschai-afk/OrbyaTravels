import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { randomUUID } from 'crypto'

const s3 = new S3Client({
  endpoint:        process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
  region:          'us-east-1',
  credentials: {
    accessKeyId:     process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  },
  forcePathStyle: true,
})

const BUCKET  = 'orbya-images'
const MAX_W   = 1400

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder: string,
): Promise<string> {
  // Resize to max 1400px wide, convert to webp
  const processed = await sharp(buffer)
    .resize({ width: MAX_W, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()

  const key = `${folder}/${randomUUID()}.webp`

  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        processed,
    ContentType: 'image/webp',
  }))

  const publicUrl = process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000'
  return `${publicUrl}/${BUCKET}/${key}`
}
