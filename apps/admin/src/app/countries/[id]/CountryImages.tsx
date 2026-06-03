'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react'

interface CountryImage { id: string; url: string; alt_text: string | null; sort_order: number }

export function CountryImages({ countryId, images }: { countryId: string; images: CountryImage[] }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { setError('Max file size is 10 MB'); return }
    if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return }

    setUploading(true)
    setError('')

    const form = new FormData()
    form.append('file', file)

    const res = await fetch(`/api/countries/${countryId}/images`, { method: 'POST', body: form })
    setUploading(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error?.message ?? 'Upload failed')
      return
    }
    router.refresh()
  }

  const remove = async (imageId: string) => {
    await fetch(`/api/countries/${countryId}/images/${imageId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div>
      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt_text ?? ''} className="w-full h-full object-cover" />
            <button
              onClick={() => remove(img.id)}
              className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Upload slot */}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="relative rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 aspect-video flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-brand-500 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-xs font-medium">Upload image</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {images.length === 0 && !uploading && (
        <p className="text-sm text-gray-400 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> No images yet — upload at least one hero image
        </p>
      )}
    </div>
  )
}
