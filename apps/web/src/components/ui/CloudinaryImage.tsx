import Image, { type ImageProps } from 'next/image'
import { cldUrl, cld } from '@/lib/cloudinary'

export { cldUrl, cld }

interface CloudinaryImageProps extends Omit<ImageProps, 'src' | 'placeholder' | 'blurDataURL'> {
  /** Cloudinary public_id stored in DB (e.g. "orbyatravel/countries/japan-hero") */
  publicId: string
  width: number
  height: number
  /** Show a blurred low-res placeholder while the full image loads */
  withBlur?: boolean
}

export function CloudinaryImage({ publicId, width, height, withBlur = true, alt, ...props }: CloudinaryImageProps) {
  const src = cldUrl(publicId, { width, height, format: 'auto', quality: 'auto' })
  const blurSrc = withBlur ? cld.placeholder(publicId) : undefined

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      placeholder={blurSrc ? 'blur' : 'empty'}
      blurDataURL={blurSrc}
      {...props}
    />
  )
}
