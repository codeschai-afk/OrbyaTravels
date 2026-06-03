const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

type Crop = 'fill' | 'fit' | 'scale' | 'crop' | 'thumb'
type Gravity = 'auto' | 'face' | 'center' | 'north' | 'south'

interface UrlOptions {
  width?: number
  height?: number
  quality?: 'auto' | 'auto:best' | 'auto:eco' | number
  format?: 'auto' | 'webp' | 'avif'
  crop?: Crop
  gravity?: Gravity
  blur?: number
}

export function cldUrl(publicId: string, opts: UrlOptions = {}): string {
  if (!CLOUD) return publicId // fallback — just return the public ID as-is during SSG

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
    blur,
  } = opts

  const parts: string[] = [
    `f_${format}`,
    `q_${quality}`,
    `c_${crop}`,
    `g_${gravity}`,
    width ? `w_${width}` : '',
    height ? `h_${height}` : '',
    blur ? `e_blur:${blur}` : '',
  ].filter(Boolean)

  return `https://res.cloudinary.com/${CLOUD}/image/upload/${parts.join(',')}/${publicId}`
}

/** Presets for common use cases */
export const cld = {
  /** Country hero — full width banner */
  hero: (id: string) => cldUrl(id, { width: 1400, height: 600, quality: 'auto', format: 'auto', crop: 'fill', gravity: 'auto' }),

  /** Country card thumbnail */
  card: (id: string) => cldUrl(id, { width: 600, height: 400, quality: 'auto', format: 'auto', crop: 'fill', gravity: 'auto' }),

  /** Listing thumbnail */
  thumb: (id: string) => cldUrl(id, { width: 400, height: 300, quality: 'auto', format: 'auto', crop: 'fill' }),

  /** Avatar */
  avatar: (id: string) => cldUrl(id, { width: 128, height: 128, quality: 'auto', format: 'auto', crop: 'thumb', gravity: 'face' }),

  /** Tiny blur placeholder — load this first, then swap in the real image */
  placeholder: (id: string) => cldUrl(id, { width: 40, height: 28, quality: 10, format: 'auto', blur: 400 }),
}
