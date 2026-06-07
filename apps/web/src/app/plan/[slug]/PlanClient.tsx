'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Heart, Loader2, Sparkles, X, MapPin,
  Clock, Compass, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  Phone, Mail, Building2, ShoppingCart, CheckCircle2,
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

const SERVICE_EMOJI: Record<string, string> = {
  ACCOMMODATION: '🏨', FLIGHT: '✈️', BUS: '🚌', TRAIN: '🚂', CAR_RENTAL: '🚗',
  TOUR_GUIDE: '🗺️', RESTAURANT: '🍽️', TRANSPORT: '🚐',
}

export interface Place {
  id:             string
  name:           string
  slug:           string
  description:    string
  category:       string
  city:           string
  latitude:       number
  longitude:      number
  images:         string[]
  inBucket:       boolean
  pin_importance: 'MAJOR' | 'MEDIUM' | 'MINOR'
}

export interface ProviderListing {
  id:         string
  title:      string
  type:       string
  base_price: number
  slug:       string
}

export interface Provider {
  id:            string
  business_name: string
  service_types: string[]
  city:          string | null
  contact_email: string
  contact_phone: string | null
  listings:      ProviderListing[]
}

interface Props {
  country:       { id: string; name: string; slug: string; hero: string | null }
  places:        Place[]
  providers:     Provider[]
  isSignedIn:    boolean
  initialCenter: [number, number]
}

// ─── Quick Book Modal ─────────────────────────────────────────────────────────

function QuickBookModal({ listing, countryId, onClose }: { listing: ProviderListing; countryId: string; onClose: () => void }) {
  const router = useRouter()
  const [checkIn,    setCheckIn]    = useState('')
  const [checkOut,   setCheckOut]   = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [bookingId,  setBookingId]  = useState<string | null>(null)
  const [error,      setError]      = useState('')

  const isAccom   = listing.type === 'ACCOMMODATION'
  const isCar     = listing.type === 'CAR_RENTAL'
  const isTransit = ['FLIGHT', 'BUS', 'TRAIN'].includes(listing.type)
  const today     = new Date().toISOString().slice(0, 10)

  const submit = async () => {
    setLoading(true); setError('')
    const body: Record<string, unknown> = { listing_id: listing.id, country_id: countryId, item_type: listing.type }
    if (isAccom) {
      if (!checkIn || !checkOut) { setError('Enter check-in and check-out dates'); setLoading(false); return }
      body.check_in_date = checkIn; body.check_out_date = checkOut
    } else if (isCar) {
      if (!pickupDate || !returnDate) { setError('Enter pickup and return dates'); setLoading(false); return }
      body.pickup_date = pickupDate; body.return_date = returnDate
    } else {
      body.passenger_count = passengers
    }
    const res  = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Booking failed'); return }
    setBookingId(data.booking_id)
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        {bookingId ? (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Booking confirmed!</h3>
            <p className="text-sm text-gray-500 mb-5">{listing.title}</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Close</button>
              <button onClick={() => { onClose(); router.push(`/bookings/${bookingId}`) }}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold">
                View booking
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="min-w-0 flex-1 pr-3">
                <h3 className="font-bold text-gray-900 text-sm truncate">{listing.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {SERVICE_EMOJI[listing.type] ?? '📋'} {listing.type.replace('_', ' ').toLowerCase()}
                  {' · '}
                  <span className="text-brand-600 font-semibold">${listing.base_price.toLocaleString()}</span>
                  <span className="text-gray-400">{isAccom ? '/night' : isCar ? '/day' : '/person'}</span>
                </p>
              </div>
              <button onClick={onClose} className="text-gray-300 hover:text-gray-500 p-1 shrink-0"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {isAccom && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Check-in</label>
                    <input type="date" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Check-out</label>
                    <input type="date" value={checkOut} min={checkIn || today} onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
                  </div>
                </>
              )}
              {isCar && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Pickup date</label>
                    <input type="date" value={pickupDate} min={today} onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Return date</label>
                    <input type="date" value={returnDate} min={pickupDate || today} onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
                  </div>
                </>
              )}
              {isTransit && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Passengers</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                      className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center font-bold text-lg">−</button>
                    <span className="font-bold text-gray-900 text-lg w-8 text-center">{passengers}</span>
                    <button onClick={() => setPassengers((p) => Math.min(20, p + 1))}
                      className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center font-bold text-lg">+</button>
                  </div>
                </div>
              )}
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            </div>
            <div className="px-5 pb-5">
              <button onClick={submit} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                {loading ? 'Booking…' : 'Book now'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PlanClient({ country, places, providers, isSignedIn, initialCenter }: Props) {
  const router = useRouter()

  const initialBucket = places.filter((p) => p.inBucket).map((p) => p.id)

  const [bucket, setBucket]               = useState<Set<string>>(new Set(initialBucket))
  const [orderedBucket, setOrderedBucket] = useState<string[]>(initialBucket)
  const [dayHints, setDayHints]           = useState<Record<string, number | null>>({})
  const [selectedId, setSelectedId]       = useState<string | null>(null)
  const [photoIdx, setPhotoIdx]           = useState(0)
  const [duration, setDuration]           = useState(5)
  const [style, setStyle]                 = useState('COMFORT')
  const [generating, setGenerating]       = useState(false)
  const [error, setError]                 = useState('')
  const [showPanel, setShowPanel]         = useState(false)
  const [bookListing, setBookListing]     = useState<{ listing: ProviderListing; countryId: string } | null>(null)

  const selected = places.find((p) => p.id === selectedId) ?? null

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id)
    setPhotoIdx(0)
  }, [])

  const toggleBucket = useCallback(async (placeId: string) => {
    if (!isSignedIn) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/plan/${country.slug}`))
      return
    }
    const wasIn = bucket.has(placeId)
    setBucket((prev) => { const n = new Set(prev); wasIn ? n.delete(placeId) : n.add(placeId); return n })
    setOrderedBucket((prev) => wasIn ? prev.filter((id) => id !== placeId) : [...prev, placeId])
    if (!wasIn) setDayHints((prev) => { const n = { ...prev }; delete n[placeId]; return n })
    await fetch('/api/bucket-list', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ place_id: placeId, action: wasIn ? 'remove' : 'add' }),
    })
  }, [bucket, country.slug, isSignedIn, router])

  const moveBucket = useCallback((idx: number, dir: -1 | 1) => {
    setOrderedBucket((prev) => {
      const arr = [...prev]
      const target = idx + dir
      if (target < 0 || target >= arr.length) return arr
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return arr
    })
  }, [])

  const handleGenerate = async () => {
    if (!isSignedIn) { router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/plan/${country.slug}`)); return }
    setGenerating(true); setError('')
    const hints = Object.fromEntries(
      Object.entries(dayHints).filter(([, v]) => v !== null)
    ) as Record<string, number>
    const res = await fetch('/api/trip-plan', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        country_id:    country.id,
        bucket_list:   orderedBucket.length > 0 ? orderedBucket : Array.from(bucket),
        day_hints:     hints,
        duration_days: duration,
        travel_style:  style,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setGenerating(false); return }
    router.push(`/plan/${country.slug}/itinerary/${data.plan_id}`)
  }

  const mapPlaces = places.map((p) => ({ ...p, inBucket: bucket.has(p.id) }))

  const nearbyProviders = selected
    ? providers.filter((p) => p.city?.toLowerCase() === selected.city?.toLowerCase())
    : []

  const photos = selected?.images ?? []

  return (
    <div className="fixed inset-0 pt-16 flex flex-col bg-[#07090f]">
      <div className="flex-1 relative overflow-hidden">

        {/* ── Full-screen map ── */}
        <CountryMap
          key={country.slug}
          places={mapPlaces}
          countrySlug={country.slug}
          initialCenter={initialCenter}
          selectedId={selectedId}
          onSelect={handleSelect}
          onBucket={toggleBucket}
        />

        {/* ── Top-left: back + country + count ── */}
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
            onClick={() => { setShowPanel((v) => !v); handleSelect(null) }}
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

        {/* ── Place detail card ── */}
        <div
          className={`absolute top-16 right-4 bottom-4 w-[320px] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-white/80 transition-all duration-300 z-[900] ${
            selected && !showPanel ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0 pointer-events-none'
          }`}
        >
          {selected && (
            <>
              {/* Photo gallery */}
              <div className="relative shrink-0 h-52 bg-gradient-to-br from-brand-100 to-brand-200">
                {photos.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photos[photoIdx]}
                    alt={selected.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl opacity-40">{CATEGORY_EMOJI[selected.category] ?? '📍'}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}
                      className="absolute right-10 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex gap-1">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                <button
                  onClick={() => handleSelect(null)}
                  className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-3 left-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm border border-white/30 px-2.5 py-1 rounded-full">
                    <span>{CATEGORY_EMOJI[selected.category] ?? '📍'}</span>
                    {CATEGORY_LABEL[selected.category] ?? selected.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-5">
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

                  {nearbyProviders.length > 0 && (
                    <div className="border-t border-gray-50 pt-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Local providers in {selected.city}
                      </p>
                      <div className="space-y-3">
                        {nearbyProviders.slice(0, 3).map((prov) => (
                          <div key={prov.id} className="bg-gray-50 rounded-xl p-3">
                            <p className="font-semibold text-gray-800 text-sm leading-tight">{prov.business_name}</p>
                            {prov.service_types.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {prov.service_types.map((s) => SERVICE_EMOJI[s] ?? '•').join(' ')}
                                {' '}{prov.service_types.map((s) => s.replace(/_/g, ' ').toLowerCase()).join(', ')}
                              </p>
                            )}

                            {/* Provider listings with prices + book button */}
                            {prov.listings.length > 0 && (
                              <div className="mt-2.5 space-y-1.5">
                                {prov.listings.slice(0, 3).map((listing) => (
                                  <div key={listing.id} className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                                    <span className="text-xs shrink-0">{SERVICE_EMOJI[listing.type] ?? '📋'}</span>
                                    <p className="text-xs text-gray-700 truncate font-medium flex-1 min-w-0">{listing.title}</p>
                                    <p className="text-xs font-bold text-brand-600 shrink-0">
                                      ${Number(listing.base_price).toLocaleString()}
                                      <span className="font-normal text-gray-400">
                                        {listing.type === 'ACCOMMODATION' ? '/night' : listing.type === 'CAR_RENTAL' ? '/day' : '/person'}
                                      </span>
                                    </p>
                                    <button
                                      onClick={() => isSignedIn
                                        ? setBookListing({ listing, countryId: country.id })
                                        : router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/plan/${country.slug}`))}
                                      className="shrink-0 flex items-center gap-0.5 bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                                    >
                                      <ShoppingCart className="w-2.5 h-2.5" />
                                      Book
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-3 mt-2">
                              {prov.contact_phone && (
                                <a href={`tel:${prov.contact_phone}`} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
                                  <Phone className="w-3 h-3" /> {prov.contact_phone}
                                </a>
                              )}
                              <a href={`mailto:${prov.contact_email}`} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
                                <Mail className="w-3 h-3" /> Email
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bucket list button */}
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

        {/* ── AI Plan panel ── */}
        <div
          className={`absolute left-4 right-4 sm:left-auto sm:right-4 sm:w-[420px] bg-white rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 transition-all duration-300 z-[900] overflow-y-auto max-h-[calc(100vh-5rem)] ${
            showPanel ? 'bottom-4 opacity-100' : 'bottom-[-120%] opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50 sticky top-0 bg-white z-10">
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
            {/* Bucket status */}
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
                  {bucket.size} place{bucket.size !== 1 ? 's' : ''} saved — AI will prioritise these in order
                </p>
              </div>
            )}

            {/* Reorder + day assignment */}
            {orderedBucket.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                  Visit order &amp; day assignment
                </p>
                <div className="space-y-1.5">
                  {orderedBucket.map((id, idx) => {
                    const place = places.find((p) => p.id === id)
                    if (!place) return null
                    return (
                      <div key={id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                        <div className="flex flex-col -my-0.5">
                          <button
                            onClick={() => moveBucket(idx, -1)}
                            disabled={idx === 0}
                            className="text-gray-300 hover:text-gray-600 disabled:opacity-20 p-0.5 transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveBucket(idx, 1)}
                            disabled={idx === orderedBucket.length - 1}
                            className="text-gray-300 hover:text-gray-600 disabled:opacity-20 p-0.5 transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-gray-500 font-bold">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">{place.name}</p>
                          {place.city && <p className="text-[11px] text-gray-400">{place.city}</p>}
                        </div>
                        <select
                          value={dayHints[id] ?? ''}
                          onChange={(e) =>
                            setDayHints((prev) => ({
                              ...prev,
                              [id]: e.target.value ? Number(e.target.value) : null,
                            }))
                          }
                          className="text-[11px] border border-gray-200 rounded-lg px-1.5 py-1 text-gray-600 bg-white outline-none cursor-pointer shrink-0"
                        >
                          <option value="">Any day</option>
                          {Array.from({ length: duration }, (_, i) => (
                            <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Use arrows to reorder · assign a preferred day to each place (optional)
                </p>
              </div>
            )}

            {/* Duration */}
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
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                {style === 'LUXURY' && 'Private car service for all transport · premium hotels'}
                {style === 'BUDGET' && 'Local buses & shared transport · hostels & guesthouses'}
                {style === 'COMFORT' && 'Mix of transport · comfortable mid-range stays'}
              </p>
            </div>

            {/* Providers overview */}
            {providers.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {providers.length} verified provider{providers.length !== 1 ? 's' : ''} in {country.name}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {style === 'LUXURY'
                    ? 'Car rentals from our fleet will be included throughout your luxury plan.'
                    : style === 'BUDGET'
                    ? 'Budget transport and stays from our providers will appear in your plan.'
                    : 'Our local providers will be suggested where applicable in your plan.'}
                </p>
              </div>
            )}

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

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 shrink-0">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <Link
              href={`/plan/${country.slug}/custom`}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Build my own plan
            </Link>
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

        {/* ── Quick book modal ── */}
        {bookListing && (
          <QuickBookModal
            listing={bookListing.listing}
            countryId={bookListing.countryId}
            onClose={() => setBookListing(null)}
          />
        )}
      </div>
    </div>
  )
}
