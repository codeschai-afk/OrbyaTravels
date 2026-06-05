'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Upload, X, MapPin } from 'lucide-react'

const CATEGORIES = [
  'BEACH', 'TEMPLE', 'MUSEUM', 'MARKET', 'PARK', 'MOUNTAIN',
  'CITY', 'VILLAGE', 'RESTAURANT', 'NIGHTLIFE', 'ADVENTURE', 'HISTORICAL', 'OTHER',
]

const schema = z.object({
  country_id:  z.string().min(1, 'Select a country'),
  name:        z.string().min(2, 'Name required'),
  slug:        z.string().min(2, 'Slug required').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  description: z.string().optional(),
  category:    z.string().min(1, 'Select a category'),
  city:        z.string().optional(),
  address:     z.string().optional(),
  latitude:    z.coerce.number().min(-90).max(90),
  longitude:   z.coerce.number().min(-180).max(180),
  is_active:   z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

interface Props {
  countries: { id: string; name: string }[]
  defaultCountryId?: string
  place?: FormData & { id: string; images: { id: string; url: string }[] }
}

export function PlaceForm({ countries, defaultCountryId, place }: Props) {
  const router = useRouter()
  const [images, setImages] = useState<{ url: string; file?: File }[]>(
    place?.images.map((i) => ({ url: i.url })) ?? []
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: place ?? { country_id: defaultCountryId ?? '', category: 'OTHER', is_active: true, latitude: 0, longitude: 0 },
  })

  const nameValue = watch('name')
  const autoSlug = () => {
    const slug = nameValue?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ?? ''
    setValue('slug', slug)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.url) setImages((prev) => [...prev, { url: data.url }])
    }
    setUploading(false)
  }

  const onSubmit = async (data: FormData) => {
    setError('')
    const method = place ? 'PATCH' : 'POST'
    const url = place ? `/api/places/${place.id}` : '/api/places'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, images: images.map((i) => i.url) }),
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Failed to save')
      return
    }
    router.push('/places')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
        <select {...register('country_id')} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
          <option value="">Select country</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.country_id && <p className="text-red-500 text-xs mt-1">{errors.country_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
          <input {...register('name')} onBlur={autoSlug}
            placeholder="Senso-ji Temple"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
          <input {...register('slug')} placeholder="senso-ji-temple"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
        <select {...register('category')} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea {...register('description')} rows={3} placeholder="What makes this place special..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
          <input {...register('city')} placeholder="Tokyo"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
          <input {...register('address')} placeholder="2 Chome-3-1 Asakusa"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Latitude</label>
          <input {...register('latitude')} type="number" step="0.0000001" placeholder="35.7147651"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Longitude</label>
          <input {...register('longitude')} type="number" step="0.0000001" placeholder="139.7966556"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude.message}</p>}
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-4 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        Find coordinates at{' '}
        <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">latlong.net</a>
      </p>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((img, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <Upload className="w-5 h-5 text-gray-400" />}
            <span className="text-xs text-gray-400 mt-1">{uploading ? 'Uploading' : 'Add photo'}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <input type="checkbox" {...register('is_active')} id="is_active" className="w-4 h-4 rounded" />
        <label htmlFor="is_active" className="text-sm text-gray-700">Visible to users (active)</label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-6 py-3 rounded-xl transition-colors">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {place ? 'Save changes' : 'Add place'}
        </button>
        <a href="/places" className="text-sm text-gray-500 hover:text-gray-700">Cancel</a>
      </div>
    </form>
  )
}
