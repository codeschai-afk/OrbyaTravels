'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Upload, X, MapPin, Plus } from 'lucide-react'

const CATEGORIES = [
  'BEACH', 'TEMPLE', 'MUSEUM', 'MARKET', 'PARK', 'MOUNTAIN',
  'CITY', 'VILLAGE', 'RESTAURANT', 'NIGHTLIFE', 'ADVENTURE', 'HISTORICAL', 'OTHER',
]

const PRESET_TAGS = [
  'Family-friendly', 'Budget', 'Luxury', 'Off-the-beaten-path', 'UNESCO',
  'Photography', 'Hiking', 'Foodie', 'Spiritual', 'Romantic', 'Solo travel',
  'Accessible', 'Free entry', 'Seasonal', 'Viewpoint', 'Wildlife',
]

const schema = z.object({
  country_id:    z.string().min(1, 'Select a country'),
  name:          z.string().min(2, 'Name required'),
  slug:          z.string().min(2, 'Slug required').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  description:   z.string().optional(),
  category:      z.string().min(1, 'Select a category'),
  pin_importance: z.enum(['MAJOR', 'MEDIUM', 'MINOR']).default('MAJOR'),
  city:          z.string().optional(),
  address:       z.string().optional(),
  latitude:      z.coerce.number().min(-90).max(90),
  longitude:     z.coerce.number().min(-180).max(180),
  is_active:     z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

interface Props {
  countries: { id: string; name: string }[]
  defaultCountryId?: string
  place?: FormData & { id: string; images: { id: string; url: string }[]; tags?: string[]; pin_importance?: string }
}

// Parse coordinates from various formats:
// "27.7172, 85.3240"  |  "27.7172 85.3240"
// "27°43'1.92\"N, 85°19'26.4\"E"  |  "@27.7172,85.324,12z"  |  "-27.7172,-85.324"
function parseCoords(raw: string): { lat: number; lng: number } | null {
  const s = raw.trim()
  // Google Maps URL @lat,lng,zoom
  const gmatch = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (gmatch) return { lat: parseFloat(gmatch[1]), lng: parseFloat(gmatch[2]) }

  // DMS: 27°43'1.92"N, 85°19'26.4"E  (also handles ' and ")
  const dms = s.match(/(\d+)[°\s](\d+)['\s](\d+\.?\d*)["\s]*([NS]),?\s*(\d+)[°\s](\d+)['\s](\d+\.?\d*)["\s]*([EW])/i)
  if (dms) {
    const lat = (parseFloat(dms[1]) + parseFloat(dms[2]) / 60 + parseFloat(dms[3]) / 3600) * (/S/i.test(dms[4]) ? -1 : 1)
    const lng = (parseFloat(dms[5]) + parseFloat(dms[6]) / 60 + parseFloat(dms[7]) / 3600) * (/W/i.test(dms[8]) ? -1 : 1)
    return { lat, lng }
  }

  // Decimal: "27.7172, 85.3240" or "27.7172 85.3240" (with optional N/S/E/W)
  const dec = s.match(/(-?\d+\.?\d*)[°\s]*[NS]?[,\s]+(-?\d+\.?\d*)[°\s]*[EW]?/i)
  if (dec) {
    const lat = parseFloat(dec[1])
    const lng = parseFloat(dec[2])
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng }
  }

  return null
}

export function PlaceForm({ countries, defaultCountryId, place }: Props) {
  const router = useRouter()
  const [images, setImages] = useState<{ url: string; file?: File }[]>(
    place?.images.map((i) => ({ url: i.url })) ?? []
  )
  const [tags, setTags] = useState<string[]>(place?.tags ?? [])
  const [customTagInput, setCustomTagInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [coordPaste, setCoordPaste] = useState('')
  const [coordError, setCoordError] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: place ?? { country_id: defaultCountryId ?? '', category: 'OTHER', pin_importance: 'MAJOR', is_active: true, latitude: 0, longitude: 0 },
  })

  const lat = watch('latitude')
  const lng = watch('longitude')

  const nameValue = watch('name')
  const autoSlug = () => {
    const slug = nameValue?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ?? ''
    setValue('slug', slug)
  }

  const handleCoordPaste = (val: string) => {
    setCoordPaste(val)
    setCoordError('')
    if (!val.trim()) return
    const parsed = parseCoords(val)
    if (parsed) {
      setValue('latitude', Math.round(parsed.lat * 10000000) / 10000000)
      setValue('longitude', Math.round(parsed.lng * 10000000) / 10000000)
    } else {
      setCoordError('Could not parse — try: 27.7172, 85.3240 or paste a Google Maps URL')
    }
  }

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const addCustomTag = () => {
    const t = customTagInput.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setCustomTagInput('')
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
      body: JSON.stringify({ ...data, tags, images: images.map((i) => i.url) }),
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Failed to save')
      return
    }
    router.push('/places')
    router.refresh()
  }

  const validCoords = lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0)
  const mapPreviewUrl = validCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lng}`
    : null

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

      {/* Primary category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary category <span className="text-gray-400 font-normal">(sets map pin icon)</span></label>
        <select {...register('category')} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
      </div>

      {/* Pin importance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Map pin visibility <span className="text-gray-400 font-normal">(controls when pin appears as map zooms in)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'MAJOR',  label: 'Major',  desc: 'Always visible', zoom: 'Zoom 0+' },
            { value: 'MEDIUM', label: 'Medium', desc: 'City-level zoom', zoom: 'Zoom 8+' },
            { value: 'MINOR',  label: 'Minor',  desc: 'Street-level zoom', zoom: 'Zoom 10+' },
          ] as const).map((opt) => {
            const val = watch('pin_importance')
            return (
              <label key={opt.value} className={`flex flex-col gap-0.5 border rounded-xl p-3 cursor-pointer transition-all ${
                val === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input type="radio" {...register('pin_importance')} value={opt.value} className="sr-only" />
                <span className="font-semibold text-sm text-gray-800">{opt.label}</span>
                <span className="text-xs text-gray-500">{opt.desc}</span>
                <span className="text-xs text-blue-500 font-medium mt-0.5">{opt.zoom}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags <span className="text-gray-400 font-normal">(choose multiple or add your own)</span></label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                tags.includes(tag)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {/* Custom tag input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
            placeholder="Add custom tag..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {/* Selected tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {tag}
                <button type="button" onClick={() => toggleTag(tag)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
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
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <MapPin className="w-3.5 h-3.5 inline mr-1" />
            Paste coordinates <span className="text-gray-400 font-normal">(any format)</span>
          </label>
          <input
            type="text"
            value={coordPaste}
            onChange={(e) => handleCoordPaste(e.target.value)}
            placeholder="27.7172, 85.3240  or  27°43'1.92&quot;N  or paste a Google Maps URL"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-mono"
          />
          {coordError && <p className="text-amber-500 text-xs mt-1">{coordError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Latitude</label>
            <input {...register('latitude')} type="number" step="0.0000001" placeholder="35.7147651"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-mono" />
            {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Longitude</label>
            <input {...register('longitude')} type="number" step="0.0000001" placeholder="139.7966556"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-mono" />
            {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude.message}</p>}
          </div>
        </div>

        {/* Mini map preview */}
        {mapPreviewUrl && (
          <div className="rounded-xl overflow-hidden border border-gray-200 h-48">
            <iframe
              src={mapPreviewUrl}
              className="w-full h-full"
              title="Location preview"
              loading="lazy"
            />
          </div>
        )}
        {!mapPreviewUrl && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            Enter coordinates above to see a map preview. Find them at{' '}
            <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">latlong.net</a>
          </p>
        )}
      </div>

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
