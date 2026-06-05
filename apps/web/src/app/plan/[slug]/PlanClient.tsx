'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Loader2, Sparkles, X, MapPin, Clock, ChevronRight } from 'lucide-react'

const CountryMap = dynamic(() => import('./CountryMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
    </div>
  ),
})

const STYLE_OPTIONS = [
  { value: 'BUDGET',  label: 'Budget',  emoji: '💰' },
  { value: 'COMFORT', label: 'Comfort', emoji: '😊' },
  { value: 'LUXURY',  label: 'Luxury',  emoji: '✨' },
]

export interface Place {
  id: string
  name: string
  slug: string
  description: string
  category: string
  city: string
  latitude: number
  longitude: number
  image: string | null
  inBucket: boolean
}

interface Props {
  country:    { id: string; name: string; slug: string; hero: string | null }
  places:     Place[]
  isSignedIn: boolean
}

export function PlanClient({ country, places, isSignedIn }: Props) {
  const router  = useRouter()
  const [bucket, setBucket]       = useState<Set<string>>(new Set(places.filter((p) => p.inBucket).map((p) => p.id)))
  const [selected, setSelected]   = useState<Place | null>(null)
  const [duration, setDuration]   = useState(5)
  const [style, setStyle]         = useState('COMFORT')
  const [generating, setGenerating] = useState(false)
  const [error, setError]         = useState('')
  const [showPanel, setShowPanel] = useState(false)

  const toggleBucket = useCallback(async (placeId: string) => {
    if (!isSignedIn) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/plan/${country.slug}`))
      return
    }
    const wasIn = bucket.has(placeId)
    setBucket((prev) => { const n = new Set(prev); wasIn ? n.delete(placeId) : n.add(placeId); return n })
    await fetch('/api/bucket-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place_id: placeId, action: wasIn ? 'remove' : 'add' }),
    })
  }, [bucket, country.slug, isSignedIn, router])

  const handleGenerate = async () => {
    if (!isSignedIn) { router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/plan/${country.slug}`)); return }
    setGenerating(true); setError('')
    const res = await fetch('/api/trip-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country_id: country.id, bucket_list: Array.from(bucket), duration_days: duration, travel_style: style }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setGenerating(false); return }
    router.push(`/plan/${country.slug}/itinerary/${data.plan_id}`)
  }

  const mapPlaces = places.map((p) => ({ ...p, inBucket: bucket.has(p.id) }))

  return (
    <div className="fixed inset-0 pt-16 flex flex-col bg-gray-900">
      {/* Full-screen map */}
      <div className="flex-1 relative">
        <CountryMap
          places={mapPlaces}
          selectedId={selected?.id ?? null}
          onSelect={(id) => setSelected(id ? (places.find((p) => p.id === id) ?? null) : null)}
          onBucket={toggleBucket}
        />

        {/* Top-left back + country name */}
        <div className="absolute top-4 left-4 z-[900] flex items-center gap-2">
          <Link
            href="/plan"
            className="flex items-center gap-1.5 bg-white/90 backdrop-blur text-gray-800 hover:bg-white text-sm font-medium px-3 py-2 rounded-xl shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="bg-white/90 backdrop-blur text-gray-900 font-bold px-4 py-2 rounded-xl shadow-sm text-sm">
            {country.name}
          </div>
          {places.length > 0 && (
            <div className="bg-white/80 backdrop-blur text-gray-500 text-xs px-3 py-2 rounded-xl shadow-sm">
              {places.length} places · {bucket.size} saved
            </div>
          )}
        </div>

        {/* Top-right: AI plan button */}
        <div className="absolute top-4 right-4 z-[900]">
          <button
            onClick={() => setShowPanel((v) => !v)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Plan my trip
            {bucket.size > 0 && (
              <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{bucket.size}</span>
            )}
          </button>
        </div>

        {/* Place detail popup — slides in from right */}
        {selected && (
          <div className="absolute top-16 right-4 bottom-4 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden z-[900] flex flex-col">
            {/* Photo */}
            {selected.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.image} alt={selected.name} className="w-full h-48 object-cover shrink-0" />
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center shrink-0">
                <MapPin className="w-10 h-10 text-brand-300" />
              </div>
            )}

            <div className="flex-1 p-5 overflow-y-auto">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg leading-tight">{selected.name}</h2>
                  {selected.city && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selected.city}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-300 hover:text-gray-500 p-1 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <span className="inline-block text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full mb-3 font-medium">
                {selected.category.charAt(0) + selected.category.slice(1).toLowerCase()}
              </span>

              {selected.description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{selected.description}</p>
              )}

              <button
                onClick={() => toggleBucket(selected.id)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  bucket.has(selected.id)
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-4 h-4 ${bucket.has(selected.id) ? 'fill-red-500' : ''}`} />
                {bucket.has(selected.id) ? 'Remove from bucket list' : 'Save to bucket list'}
              </button>
            </div>
          </div>
        )}

        {/* AI Plan panel — slides in from bottom */}
        {showPanel && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-2xl shadow-2xl p-5 z-[900]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Generate AI itinerary
              </h3>
              <button onClick={() => setShowPanel(false)} className="text-gray-300 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bucket.size === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5 mb-4">
                Tap the ♥ on map pins to save places — the AI builds your route around them.
              </p>
            )}

            {bucket.size > 0 && (
              <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2.5 mb-4">
                {bucket.size} place{bucket.size !== 1 ? 's' : ''} in your bucket list
              </p>
            )}

            {/* Duration */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Trip duration</span>
                <span className="font-bold text-brand-600">{duration} days</span>
              </div>
              <input type="range" min={2} max={21} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-brand-600" />
            </div>

            {/* Style */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Travel style</p>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button key={s.value} type="button" onClick={() => setStyle(s.value)}
                    className={`flex flex-col items-center py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      style === s.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}>
                    <span className="text-xl mb-1">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

            <button onClick={handleGenerate} disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Building your plan…</> : <><Sparkles className="w-4 h-4" /> Generate itinerary</>}
            </button>
          </div>
        )}

        {/* Empty state overlay */}
        {places.length === 0 && (
          <div className="absolute inset-0 flex items-end justify-center pb-20 pointer-events-none z-[800]">
            <div className="bg-white/90 backdrop-blur rounded-2xl px-6 py-4 text-center shadow-lg pointer-events-auto">
              <p className="font-semibold text-gray-800">No places added yet</p>
              <p className="text-xs text-gray-500 mt-1">An employee needs to add attractions for {country.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
