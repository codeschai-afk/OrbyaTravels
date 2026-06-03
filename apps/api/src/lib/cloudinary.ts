import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export type UploadFolder = 'countries' | 'listings' | 'providers' | 'avatars'

export async function uploadImage(
  file: Buffer | string,
  folder: UploadFolder,
  publicId?: string
) {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/webp;base64,${file.toString('base64')}`,
    {
      folder: `orbyatravel/${folder}`,
      public_id: publicId,
      overwrite: !!publicId,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    }
  )
  return { url: result.secure_url, public_id: result.public_id }
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId)
}

export { cloudinary }
