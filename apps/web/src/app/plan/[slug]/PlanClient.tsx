'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Heart, Loader2, Sparkles, X, MapPin,
  Clock, Compass, ChevronRight,
} from 'lucide-react'

const CountryMap = dynamic(() => import('./CountryMap'), {
  ssr:     false,
  loading: () => (
    <div className="w-full h-full bg-[#07090f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-white/20" />
        <span className="text-xs text-white/30 font-medium tracking-widest uppercase">Loading map…</span>
      </div>
    </div>
  ),
})

const STYLE_OPTIONS = [
  { value: 'BUDGET',  label: 'Budget',  emoji: '💰', desc: 'Best value stays & transport' },
  { value: 'COMFORT', label: 'Comfort', emoji: '😊', desc: 'Mid-range, quality experience'  },
  { value: 'LUXURY',  label: 'Luxury',  emoji: '✨', desc: 'Premium hotels & business class' },
]

const CATEGORY_LABEL: Record<string, string> = {
  BEACH: 'Beach', TEMPLE: 'Temple', MUSEUM: 'Museum', MARKET: 'Market',
  PARK: 'Park', MOUNTAIN: 'Mountain', CITY: 'City', VILLAGE: 'Village',
  RESTAURANT: 'Restaurant', NIGHTLIFE: 'Nightlife', ADVENTURE: 'Adventure',
  HISTORICAL: 'Historical', OTHER: 'Point of interest',
}

const CATEGORY_EMOJI: Record<string, string> = {
  BEACH: '🏖️', TEMPLE: '⛩️', MUSEUM: '🏛️', MARKET: '🛍️', PARK: '🌳',
  MOUNTAIN: '⛰️', CITY: '🏙️', VILLAGE: '🏡', RESTAURANT: '🍜',
  NIGHTLIFE: '🎶', ADVENTURE: '🧗', HISTORICAL: '🏯', OTHER: '📍',
}

export interface Place {
  id: string; name: string; slug: string; description: string
  category: string; city: string
  latitude: number; longitude: number
  image: string | null; inBucket: boolean
}

interface Props {
  country:       { id: string; name: string; slug: string; hero: string | null }
  places:        Place[]
  isSignedIn:    boolean
  initialCenter: [number, number]
}

export function PlanClient({ country, places, isSignedIn, initialCenter }: Props) {
  const router   = useRouter()
  const [bucket, setBucket]         = useState<Set<string>>(new Set(places.filter((p) => p.inBucket).map((p) => p.id)))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [duration, setDuration]     = useState(5)
  const [style, setStyle]           = useState('COMFORT')
  const [generating, setGenerating] = useState(false)
  const [error, setError]           = useState('')
  const [showPanel, setShowPanel]   = useState(false)

  const selected = places.find((p) => p.id === selectedId) ?? null

  const toggleBucket = useCallback(async (placeId: string) => {
    if (!isSignedIn) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/plan/${country.slug}`))
      return
    }
    const wasIn = bucket.has(placeId)
    setBucket((prev) => { const n = new Set(prev); wasIn ? n.delete(placeId) : n.add(placeId); return n })
    await fetch('/api/bucket-list', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ place_id: placeId, action: wasIn ? 'remove' : 'add' }),
    })
  }, [bucket, country.slug, isSignedIn, router])

  const handleGenerate = async () => {
    if (!isSignedIn) { router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/plan/${country.slug}`)); return }
    setGenerating(true); setError('')
    const res = await fetch('/api/trip-plan', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ country_id: country.id, bucket_list: Array.from(bucket), duration_days: duration, travel_style: style }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setGenerating(false); return }
    router.push(`/plan/${country.slug}/itinerary/${data.plan_id}`)
  }

  const mapPlaces = places.map((p) => ({ ...p, inBucket: bucket.has(p.id) }))

  return (
    <div className="fixed inset-0 pt-16 flex flex-col bg-[#07090f]">
      <div className="flex-1 relative overflow-hidden">

        {/* ── Full-screen map ── */}
        <CountryMap
          key={country.slug}
          places={mapPlaces}
          initialCenter={initialCenter}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onBucket={toggleBucket}
        />

        {/* ── Top-left: back + country name ── */}
        <div className="absolute top-4 left-4 z-[900] flex items-center gap-2">
          <Link
            href="/plan"
            className="flex items-center gap-1 bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-xl shadow-lg shadow-black/10 border border-white/60 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg shadow-black/10 border border-white/60">
            <Compass className="w-3.5 h-3.5 text-brand-500" />
            <span className="font-bold text-gray-900 text-sm tracking-tight">{country.name}</span>
          </div>

          {places.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm text-gray-500 text-xs px-3 py-2 rounded-xl shadow-lg shadow-black/8 border border-white/60 font-medium">
              {places.length} places · <span className="text-red-500">{bucket.size} saved</span>
            </div>
          )}
        </div>

        {/* ── Top-right: AI plan button ── */}
        <div className="absolute top-4 right-4 z-[900]">
          <button
            onClick={() => { setShowPanel((v) => !v); setSelectedId(null) }}
            className={`flex items-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all ${
              showPanel
                ? 'bg-gray-900 text-white shadow-black/20'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Plan my trip
            {bucket.size > 0 && (
              <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{bucket.size}</span>
            )}
          </button>
        </div>

        {/* ── Place detail card (slides in from right) ── */}
        <div
          className={`absolute top-16 right-4 bottom-4 w-[320px] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-white/80 transition-all duration-300 z-[900] ${
            selected ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0 pointer-events-none'
          }`}
        >
          {selected && (
            <>
              {/* Photo */}
              <div className="relative shrink-0 h-52 bg-gradient-to-br from-brand-100 to-brand-200">
                {selected.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.image}
                    alt={selected.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl opacity-40">{CATEGORY_EMOJI[selected.category] ?? '📍'}</span>
                  </div>
                )}

                {/* Gradient overlay on image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Close button */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Category badge over image */}
                <div className="absolute bottom-3 left-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm border border-white/30 px-2.5 py-1 rounded-full">
                    <span>{CATEGORY_EMOJI[selected.category] ?? '📍'}</span>
                    {CATEGORY_LABEL[selected.category] ?? selected.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-5 overflow-y-auto">
                <h2 className="font-bold text-gray-900 text-xl leading-tight mb-1">{selected.name}</h2>
                {selected.city && (
                  <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-4">
                    <MapPin className="w-3.5 h-3.5" />
                    {selected.city}
                  </p>
                )}

                {selected.description && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-5">{selected.description}</p>
                )}
              </div>

              {/* Bucket list button — pinned to bottom */}
              <div className="p-4 border-t border-gray-50 shrink-0">
                <button
                  onClick={() => toggleBucket(selected.id)}
                  className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm transition-all ${
                    bucket.has(selected.id)
                      ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${bucket.has(selected.id) ? 'fill-red-500' : ''}`} />
                  {bucket.has(selected.id) ? 'Saved to bucket list' : 'Save to bucket list'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── AI Plan panel (slides in from bottom) ── */}
        <div
          className={`absolute left-4 right-4 sm:left-auto sm:right-4 sm:w-[400px] bg-white rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 transition-all duration-300 z-[900] ${
            showPanel ? 'bottom-4 opacity-100' : 'bottom-[-120%] opacity-0 pointer-events-none'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Build your itinerary
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">AI-crafted day-by-day plan for {country.name}</p>
            </div>
            <button onClick={() => setShowPanel(false)} className="text-gray-300 hover:text-gray-500 p-1 transition-colors rounded-lg hover:bg-gray-50">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Bucket list status */}
            {bucket.size === 0 ? (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <span className="text-lg mt-0.5">💡</span>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Tap pins on the map to save places to your bucket list — the AI builds your route around them.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <Heart className="w-4 h-4 text-red-500 fill-red-500 shrink-0" />
                <p className="text-xs text-green-700 font-medium">
                  {bucket.size} place{bucket.size !== 1 ? 's' : ''} saved — AI will prioritise these
                </p>
              </div>
            )}

            {/* Duration slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">Trip duration</span>
                </div>
                <div className="bg-brand-50 text-brand-700 font-bold text-sm px-3 py-1 rounded-lg">
                  {duration} {duration === 1 ? 'day' : 'days'}
                </div>
              </div>
              <input
                type="range" min={2} max={21} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-300 mt-1.5">
                <span>2</span><span>21 days</span>
              </div>
            </div>

            {/* Travel style */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Travel style</p>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStyle(s.value)}
                    className={`flex flex-col items-center pt-3 pb-2.5 px-1 rounded-xl border text-xs font-semibold transition-all ${
                      style === s.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm shadow-brand-100'
                        : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl mb-1.5">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-brand-600/20"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Crafting your plan…</>
                : <><Sparkles className="w-4 h-4" /> Generate itinerary <ChevronRight className="w-4 h-4 opacity-70" /></>
              }
            </button>
          </div>
        </div>

        {/* ── Empty state ── */}
        {places.length === 0 && (
          <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none z-[800]">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 text-center shadow-xl shadow-black/10 border border-white/80 pointer-events-auto max-w-xs">
              <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="font-semibold text-gray-800 text-sm">No places added yet</p>
              <p className="text-xs text-gray-400 mt-1">An employee needs to pin attractions for {country.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
