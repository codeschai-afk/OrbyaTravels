'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Trash2, Loader2, Save, Sparkles,
  Hotel, Bus, Landmark, Search, X, Clock, Star, Car, Train, Plane,
  MapPin,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Place    { id: string; name: string; city: string; category: string }
interface Listing  { id: string; title: string; type: string; base_price: number; slug: string; city: string | null; stars: number | null; vehicle: string | null }

interface Leg {
  _id:              string
  order:            number
  type:             'PLACE' | 'TRANSPORT' | 'ACCOMMODATION'
  title:            string
  description:      string
  duration_minutes: number | null
  listing_id:       string | null
  place_id:         string | null
}

interface Day {
  _id:        string
  day_number: number
  title:      string
  notes:      string
  legs:       Leg[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { value: 'BUDGET',  label: 'Budget',  emoji: '💰' },
  { value: 'COMFORT', label: 'Comfort', emoji: '😊' },
  { value: 'LUXURY',  label: 'Luxury',  emoji: '✨' },
]

const TYPE_ICON: Record<string, React.FC<{ className?: string }>> = {
  PLACE: Landmark, TRANSPORT: Bus, ACCOMMODATION: Hotel,
  CAR_RENTAL: Car, TRAIN: Train, FLIGHT: Plane,
}

const LEG_TYPE_COLOR: Record<string, string> = {
  PLACE:         'bg-brand-50 text-brand-600',
  TRANSPORT:     'bg-amber-50 text-amber-600',
  ACCOMMODATION: 'bg-emerald-50 text-emerald-600',
}

function fmt(price: number) {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function uid() { return Math.random().toString(36).slice(2) }

// ─── Add Leg Modal ────────────────────────────────────────────────────────────

function AddLegModal({
  places, listings, onAdd, onClose,
}: {
  places:   Place[]
  listings: Listing[]
  onAdd:    (leg: Omit<Leg, '_id' | 'order'>) => void
  onClose:  () => void
}) {
  const [tab, setTab]     = useState<'PLACE' | 'TRANSPORT' | 'ACCOMMODATION'>('PLACE')
  const [query, setQuery] = useState('')

  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) || p.city.toLowerCase().includes(query.toLowerCase())
  )

  const filteredListings = listings
    .filter((l) => tab === 'ACCOMMODATION' ? l.type === 'ACCOMMODATION' : l.type !== 'ACCOMMODATION')
    .filter((l) => l.title.toLowerCase().includes(query.toLowerCase()) || (l.city ?? '').toLowerCase().includes(query.toLowerCase()))

  const addPlace = (place: Place) => {
    onAdd({ type: 'PLACE', title: place.name, description: '', duration_minutes: null, listing_id: null, place_id: place.id })
    onClose()
  }

  const addListing = (listing: Listing) => {
    onAdd({ type: tab, title: listing.title, description: '', duration_minutes: null, listing_id: listing.id, place_id: null })
    onClose()
  }

  const addBlank = () => {
    const label = tab === 'PLACE' ? 'Activity' : tab === 'ACCOMMODATION' ? 'Accommodation' : 'Transport'
    onAdd({ type: tab, title: label, description: '', duration_minutes: null, listing_id: null, place_id: null })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900">Add leg</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Type tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {(['PLACE', 'TRANSPORT', 'ACCOMMODATION'] as const).map((t) => {
            const Icon = TYPE_ICON[t]
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setQuery('') }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                  tab === t ? 'border-brand-500 text-brand-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t === 'PLACE' ? 'Place' : t === 'TRANSPORT' ? 'Transport' : 'Stay'}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${tab === 'PLACE' ? 'attractions' : tab === 'ACCOMMODATION' ? 'hotels & stays' : 'transport'}…`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {/* Blank option */}
          <button
            onClick={addBlank}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-left mb-1 border border-dashed border-gray-200"
          >
            <Plus className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-500">Add blank {tab.toLowerCase()} leg</p>
          </button>

          {/* Places */}
          {tab === 'PLACE' && filteredPlaces.map((place) => {
            const Icon = TYPE_ICON[place.category] ?? Landmark
            return (
              <button
                key={place.id}
                onClick={() => addPlace(place)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
                  {place.city && <p className="text-xs text-gray-400">{place.city}</p>}
                </div>
                <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              </button>
            )
          })}

          {/* Listings */}
          {tab !== 'PLACE' && filteredListings.map((listing) => {
            const Icon = TYPE_ICON[listing.type] ?? Bus
            return (
              <button
                key={listing.id}
                onClick={() => addListing(listing)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {listing.city && <p className="text-xs text-gray-400">{listing.city}</p>}
                    {listing.stars && (
                      <div className="flex">
                        {Array.from({ length: listing.stars }).map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                    {listing.vehicle && <p className="text-xs text-gray-400">{listing.vehicle}</p>}
                  </div>
                </div>
                <p className="text-sm font-bold text-brand-600 shrink-0">{fmt(listing.base_price)}</p>
              </button>
            )
          })}

          {tab === 'PLACE' && filteredPlaces.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400">No places found for this country yet.</p>
          )}
          {tab !== 'PLACE' && filteredListings.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400">No {tab === 'ACCOMMODATION' ? 'hotel' : 'transport'} listings available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

export function CustomPlanBuilder({
  country, places, listings,
}: {
  country:  { id: string; name: string; slug: string }
  places:   Place[]
  listings: Listing[]
}) {
  const router = useRouter()

  const [title, setTitle]   = useState(`My ${country.name} Trip`)
  const [style, setStyle]   = useState('COMFORT')
  const [duration, setDuration] = useState(5)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [addLegFor, setAddLegFor] = useState<string | null>(null) // day._id

  // Generate initial empty days
  const makeDays = (n: number): Day[] =>
    Array.from({ length: n }, (_, i) => ({
      _id:        uid(),
      day_number: i + 1,
      title:      `Day ${i + 1}`,
      notes:      '',
      legs:       [],
    }))

  const [days, setDays] = useState<Day[]>(() => makeDays(5))

  // Sync days count when duration changes
  const handleDurationChange = (n: number) => {
    setDuration(n)
    setDays((prev) => {
      if (n > prev.length) {
        return [...prev, ...Array.from({ length: n - prev.length }, (_, i) => ({
          _id:        uid(),
          day_number: prev.length + i + 1,
          title:      `Day ${prev.length + i + 1}`,
          notes:      '',
          legs:       [],
        }))]
      }
      return prev.slice(0, n).map((d, i) => ({ ...d, day_number: i + 1 }))
    })
  }

  const addLeg = useCallback((dayId: string, legData: Omit<Leg, '_id' | 'order'>) => {
    setDays((prev) => prev.map((day) => {
      if (day._id !== dayId) return day
      const newLeg: Leg = { ...legData, _id: uid(), order: day.legs.length }
      return { ...day, legs: [...day.legs, newLeg] }
    }))
  }, [])

  const removeLeg = useCallback((dayId: string, legId: string) => {
    setDays((prev) => prev.map((day) => {
      if (day._id !== dayId) return day
      return { ...day, legs: day.legs.filter((l) => l._id !== legId).map((l, i) => ({ ...l, order: i })) }
    }))
  }, [])

  const updateLegTitle = useCallback((dayId: string, legId: string, title: string) => {
    setDays((prev) => prev.map((day) => {
      if (day._id !== dayId) return day
      return { ...day, legs: day.legs.map((l) => l._id !== legId ? l : { ...l, title }) }
    }))
  }, [])

  const updateDayTitle = useCallback((dayId: string, title: string) => {
    setDays((prev) => prev.map((day) => day._id !== dayId ? day : { ...day, title }))
  }, [])

  const handleSave = async () => {
    if (!title.trim()) { setError('Plan title is required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/trip-plan/custom', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        country_id:    country.id,
        title:         title.trim(),
        duration_days: duration,
        travel_style:  style,
        days:          days.map((day) => ({
          day_number: day.day_number,
          title:      day.title || `Day ${day.day_number}`,
          notes:      day.notes,
          legs:       day.legs.map((leg, i) => ({
            order:            i,
            type:             leg.type,
            title:            leg.title,
            description:      leg.description,
            duration_minutes: leg.duration_minutes,
            listing_id:       leg.listing_id,
            place_id:         leg.place_id,
          })),
        })),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
    router.push(`/plan/${country.slug}/itinerary/${data.plan_id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/plan/${country.slug}`} className="text-gray-400 hover:text-gray-600 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-gray-900 text-lg bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-brand-400 transition-colors truncate w-full max-w-xs"
                placeholder="My trip title…"
              />
              <p className="text-xs text-gray-400 mt-0.5">{country.name} · Custom plan</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save plan
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Settings row */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-wrap gap-6">
          {/* Duration */}
          <div className="flex-1 min-w-36">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />Duration
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={1} max={21} value={duration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full accent-brand-600 cursor-pointer"
              />
              <span className="text-sm font-bold text-brand-700 w-16 text-right">{duration} days</span>
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />Style
            </label>
            <div className="flex gap-2">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    style === s.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* Days */}
        {days.map((day) => (
          <div key={day._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Day header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {day.day_number}
              </div>
              <input
                value={day.title}
                onChange={(e) => updateDayTitle(day._id, e.target.value)}
                className="flex-1 font-semibold text-gray-900 bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-brand-400 transition-colors"
                placeholder={`Day ${day.day_number} title…`}
              />
            </div>

            {/* Legs */}
            <div className="divide-y divide-gray-50">
              {day.legs.map((leg) => {
                const Icon = LEG_TYPE_COLOR[leg.type] ? (TYPE_ICON[leg.type] ?? Landmark) : Landmark
                return (
                  <div key={leg._id} className="flex items-center gap-3 px-5 py-3 group">
                    <div className={`p-1.5 rounded-lg shrink-0 ${LEG_TYPE_COLOR[leg.type]}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <input
                      value={leg.title}
                      onChange={(e) => updateLegTitle(day._id, leg._id, e.target.value)}
                      className="flex-1 text-sm text-gray-800 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-brand-400 transition-colors"
                    />
                    {leg.listing_id && (
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">Provider</span>
                    )}
                    <button
                      onClick={() => removeLeg(day._id, leg._id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Add leg button */}
            <div className="px-5 py-3 border-t border-gray-50">
              <button
                onClick={() => setAddLegFor(day._id)}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-brand-600 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add leg
              </button>
            </div>
          </div>
        ))}

        {/* AI suggestion prompt */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-brand-800">Prefer AI to plan this for you?</p>
            <p className="text-xs text-brand-600 mt-0.5">
              <Link href={`/plan/${country.slug}`} className="underline underline-offset-2">Go back to the map</Link>
              {' '}and use the AI plan builder — it'll include our providers automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Add leg modal */}
      {addLegFor && (
        <AddLegModal
          places={places}
          listings={listings}
          onAdd={(legData) => addLeg(addLegFor, legData)}
          onClose={() => setAddLegFor(null)}
        />
      )}
    </div>
  )
}
