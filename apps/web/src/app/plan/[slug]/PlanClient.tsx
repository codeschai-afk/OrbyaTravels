'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Heart, Loader2, Sparkles, ChevronDown } from 'lucide-react'

const CountryMap = dynamic(() => import('./CountryMap'), { ssr: false, loading: () => (
  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
  </div>
) })

const CATEGORY_ICON: Record<string, string> = {
  BEACH: '🏖️', TEMPLE: '⛩️', MUSEUM: '🏛️', MARKET: '🛒', PARK: '🌳',
  MOUNTAIN: '⛰️', CITY: '🏙️', VILLAGE: '🏡', RESTAURANT: '🍜',
  NIGHTLIFE: '🎶', ADVENTURE: '🧗', HISTORICAL: '🏯', OTHER: '📍',
}

const STYLE_OPTIONS = [
  { value: 'BUDGET',  label: 'Budget',  emoji: '💰', desc: 'Cost-effective choices, local transport, hostels' },
  { value: 'COMFORT', label: 'Comfort', emoji: '😊', desc: 'Mid-range hotels, mix of transport, balanced pace' },
  { value: 'LUXURY',  label: 'Luxury',  emoji: '✨', desc: 'Premium hotels, private transfers, exclusive experiences' },
]

interface Place {
  id: string; name: string; slug: string; description: string; category: string
  city: string; latitude: number; longitude: number; image: string | null; inBucket: boolean
}

interface Props {
  country: { id: string; name: string; slug: string; hero: string | null }
  places:  Place[]
  isSignedIn: boolean
}

export function PlanClient({ country, places, isSignedIn }: Props) {
  const router = useRouter()
  const [bucket, setBucket] = useState<Set<string>>(
    new Set(places.filter((p) => p.inBucket).map((p) => p.id))
  )
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null)
  const [duration, setDuration] = useState(5)
  const [style, setStyle] = useState('COMFORT')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showPlanner, setShowPlanner] = useState(false)

  const toggleBucket = useCallback(async (placeId: string) => {
    if (!isSignedIn) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/plan/${country.slug}`))
      return
    }
    const inBucket = bucket.has(placeId)
    setBucket((prev) => {
      const next = new Set(prev)
      inBucket ? next.delete(placeId) : next.add(placeId)
      return next
    })
    await fetch('/api/bucket-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place_id: placeId, action: inBucket ? 'remove' : 'add' }),
    })
  }, [bucket, country.slug, isSignedIn, router])

  const handleGeneratePlan = async () => {
    if (!isSignedIn) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/plan/${country.slug}`))
      return
    }
    setGenerating(true)
    setError('')
    const res = await fetch('/api/trip-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country_id: country.id, bucket_list: Array.from(bucket), duration_days: duration, travel_style: style }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to generate plan'); setGenerating(false); return }
    router.push(`/plan/${country.slug}/itinerary/${data.plan_id}`)
  }

  const bucketPlaces = places.filter((p) => bucket.has(p.id))
  const selected = places.find((p) => p.id === selectedPlace)

  return (
    <div className="h-screen flex flex-col pt-16">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white border-b border-gray-100 shrink-0">
        <Link href="/plan" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Destinations
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="font-semibold text-gray-900">{country.name}</h1>
        <span className="text-xs text-gray-400 ml-auto">{places.length} places · {bucket.size} in bucket</span>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — places list */}
        <aside className="w-80 shrink-0 border-r border-gray-100 bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Visiting spots</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {places.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No places curated for this country yet
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-gray-50">
                {places.map((place) => (
                  <div
                    key={place.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedPlace === place.id ? 'bg-brand-50 border-l-2 border-brand-500' : ''}`}
                    onClick={() => setSelectedPlace(place.id === selectedPlace ? null : place.id)}
                  >
                    <span className="text-xl shrink-0">{CATEGORY_ICON[place.category] ?? '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
                      <p className="text-xs text-gray-400 truncate">{place.city || place.category.toLowerCase()}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBucket(place.id) }}
                      className={`p-1.5 rounded-full transition-colors shrink-0 ${bucket.has(place.id) ? 'bg-red-50 text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                    >
                      <Heart className={`w-4 h-4 ${bucket.has(place.id) ? 'fill-red-500' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Planner panel */}
          <div className="border-t border-gray-100 shrink-0">
            <button
              onClick={() => setShowPlanner((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Generate AI itinerary
                {bucket.size > 0 && (
                  <span className="bg-brand-100 text-brand-700 text-xs px-1.5 py-0.5 rounded-full">{bucket.size}</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPlanner ? 'rotate-180' : ''}`} />
            </button>

            {showPlanner && (
              <div className="px-4 pb-4 space-y-3">
                {bucket.size === 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    Add places to your bucket list using ♥ — the AI uses them to build your route.
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Duration</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min={2} max={21} value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="flex-1 accent-brand-600"
                    />
                    <span className="text-sm font-semibold text-gray-800 w-16 text-right">{duration} days</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Travel style</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {STYLE_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStyle(s.value)}
                        className={`flex flex-col items-center py-2 px-1 rounded-xl border text-xs font-medium transition-colors ${style === s.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      >
                        <span className="text-lg mb-0.5">{s.emoji}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <button
                  onClick={handleGeneratePlan}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? 'Building your plan…' : 'Generate plan'}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <CountryMap
            places={places.map((p) => ({ ...p, inBucket: bucket.has(p.id) }))}
            selectedId={selectedPlace}
            onSelect={setSelectedPlace}
            onBucket={toggleBucket}
          />

          {/* Place detail popup overlay */}
          {selected && (
            <div className="absolute top-4 right-4 w-72 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-[1000]">
              {selected.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.image} alt={selected.name} className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{selected.name}</h3>
                  <button onClick={() => toggleBucket(selected.id)}
                    className={`p-1.5 rounded-full shrink-0 transition-colors ${bucket.has(selected.id) ? 'bg-red-50 text-red-500' : 'text-gray-300 hover:text-red-400'}`}>
                    <Heart className={`w-4 h-4 ${bucket.has(selected.id) ? 'fill-red-500' : ''}`} />
                  </button>
                </div>
                {selected.city && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3" /> {selected.city}
                  </p>
                )}
                {selected.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{selected.description}</p>
                )}
                <button onClick={() => setSelectedPlace(null)} className="mt-3 text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
