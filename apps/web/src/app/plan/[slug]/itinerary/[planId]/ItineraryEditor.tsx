'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, Clock, Lightbulb, Hotel, Bus, Landmark,
  Edit3, Check, X, RefreshCw, Trash2, ChevronUp, ChevronDown,
  Star, Search, Loader2, CheckCircle2, Car, Train, Plane, Building2,
  ShoppingCart,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Listing {
  id: string; title: string; type: string; base_price: number; slug: string
  city: string | null; stars: number | null; vehicle: string | null
}

interface Leg {
  id: string; order: number; type: string; title: string; description: string
  duration_minutes: number | null; tip: string | null
  listing_id: string | null
  listing: { id: string; title: string; type: string; base_price: number } | null
}

interface Day { id: string; day_number: number; title: string; notes: string; legs: Leg[] }

interface Plan {
  id: string; title: string; duration_days: number; travel_style: string
  country: { id: string; name: string; slug: string }
  days: Day[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLE_BADGE: Record<string, { label: string; cls: string }> = {
  BUDGET:  { label: '💰 Budget',  cls: 'bg-green-100 text-green-700' },
  COMFORT: { label: '😊 Comfort', cls: 'bg-blue-100 text-blue-700' },
  LUXURY:  { label: '✨ Luxury',  cls: 'bg-purple-100 text-purple-700' },
}

const LEG_ICON: Record<string, React.FC<{ className?: string }>> = {
  PLACE: Landmark, TRANSPORT: Bus, ACCOMMODATION: Hotel,
}

const TYPE_ICON: Record<string, React.FC<{ className?: string }>> = {
  ACCOMMODATION: Hotel, CAR_RENTAL: Car, BUS: Bus, TRAIN: Train, FLIGHT: Plane,
}

const TYPE_COLOR: Record<string, string> = {
  ACCOMMODATION: 'bg-emerald-100 text-emerald-600',
  CAR_RENTAL:    'bg-amber-100 text-amber-600',
  BUS:           'bg-sky-100 text-sky-600',
  TRAIN:         'bg-violet-100 text-violet-600',
  FLIGHT:        'bg-rose-100 text-rose-600',
}

const SWAPPABLE_TYPES: Record<string, string[]> = {
  ACCOMMODATION: ['ACCOMMODATION'],
  TRANSPORT:     ['FLIGHT', 'BUS', 'TRAIN', 'CAR_RENTAL'],
}

function fmt(price: number) {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtDuration(m: number) {
  const h = Math.floor(m / 60), min = m % 60
  return h > 0 ? `${h}h${min > 0 ? ` ${min}m` : ''}` : `${min}m`
}

// ─── Swap Listing Modal ────────────────────────────────────────────────────────

function SwapModal({
  legType, listings, currentListingId, travelStyle, onSelect, onClose,
}: {
  legType: string
  listings: Listing[]
  currentListingId: string | null
  travelStyle: string
  onSelect: (listing: Listing | null) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const allowedTypes = SWAPPABLE_TYPES[legType] ?? []

  let candidates = listings.filter((l) => allowedTypes.includes(l.type))

  // Sort by style preference
  if (legType === 'TRANSPORT') {
    if (travelStyle === 'LUXURY') {
      candidates = [
        ...candidates.filter((l) => l.type === 'CAR_RENTAL'),
        ...candidates.filter((l) => l.type !== 'CAR_RENTAL'),
      ]
    } else if (travelStyle === 'BUDGET') {
      candidates = [
        ...candidates.filter((l) => ['BUS', 'TRAIN'].includes(l.type)),
        ...candidates.filter((l) => !['BUS', 'TRAIN'].includes(l.type)),
      ]
    }
  }

  const filtered = candidates.filter(
    (l) => l.title.toLowerCase().includes(query.toLowerCase()) || (l.city ?? '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">
              {legType === 'ACCOMMODATION' ? 'Swap accommodation' : travelStyle === 'LUXURY' ? 'Book car rental' : 'Swap transport'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {legType === 'ACCOMMODATION'
                ? 'Choose from verified hotels & stays'
                : travelStyle === 'LUXURY'
                ? 'Private car rentals — recommended for luxury travel'
                : 'Flights, buses, trains, car rentals'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Luxury tip */}
        {legType === 'TRANSPORT' && travelStyle === 'LUXURY' && filtered.some((l) => l.type === 'CAR_RENTAL') && (
          <div className="mx-5 mt-3 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 text-xs text-purple-700 flex items-center gap-1.5 shrink-0">
            <Car className="w-3.5 h-3.5 shrink-0" />
            Car rentals are shown first for your luxury trip — or choose local transport below
          </div>
        )}

        {/* Budget tip */}
        {legType === 'TRANSPORT' && travelStyle === 'BUDGET' && (
          <div className="mx-5 mt-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs text-green-700 flex items-center gap-1.5 shrink-0">
            <Bus className="w-3.5 h-3.5 shrink-0" />
            Budget-friendly buses and trains shown first
          </div>
        )}

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or city…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* Listings */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No {legType === 'ACCOMMODATION' ? 'hotel' : 'transport'} listings available for this country yet.
            </div>
          ) : (
            <div className="space-y-1">
              {currentListingId && (
                <button
                  onClick={() => onSelect(null)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Remove provider booking</p>
                    <p className="text-xs text-gray-400">Revert to AI suggestion</p>
                  </div>
                </button>
              )}

              {filtered.map((listing) => {
                const Icon = TYPE_ICON[listing.type] ?? Bus
                const colorCls = TYPE_COLOR[listing.type] ?? 'bg-gray-100 text-gray-500'
                return (
                  <button
                    key={listing.id}
                    onClick={() => onSelect(listing)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                      currentListingId === listing.id ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colorCls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                        {currentListingId === listing.id && <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {listing.city && <p className="text-xs text-gray-400">{listing.city}</p>}
                        {listing.stars && (
                          <div className="flex">
                            {Array.from({ length: listing.stars }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        )}
                        {listing.vehicle && <p className="text-xs text-gray-400">{listing.vehicle}</p>}
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full capitalize">
                          {listing.type.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-brand-600">{fmt(listing.base_price)}</p>
                      <p className="text-xs text-gray-400">
                        {listing.type === 'ACCOMMODATION' ? '/night' : '/person'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Provider Sidebar ─────────────────────────────────────────────────────────

function ProviderSidebar({
  listings, travelStyle, assigningListing, onAssign,
}: {
  listings: Listing[]
  travelStyle: string
  assigningListing: Listing | null
  onAssign: (listing: Listing) => void
}) {
  const stays        = listings.filter((l) => l.type === 'ACCOMMODATION')
  const transport    = listings.filter((l) => l.type !== 'ACCOMMODATION')

  if (listings.length === 0) return null

  const typeOrder    = ['CAR_RENTAL', 'BUS', 'TRAIN', 'FLIGHT']
  const sortedTransport = [...transport].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type))

  const AssignBtn = ({ listing }: { listing: Listing }) => (
    <button
      onClick={() => onAssign(listing)}
      className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors shrink-0 ${
        assigningListing?.id === listing.id
          ? 'bg-brand-600 text-white'
          : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
      }`}
    >
      {assigningListing?.id === listing.id ? 'Cancel' : 'Assign'}
    </button>
  )

  return (
    <div className="space-y-4">
      {assigningListing && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-800 leading-relaxed flex items-start gap-2">
          <span className="text-base shrink-0">👆</span>
          <span>Assigning <strong>{assigningListing.title}</strong> — click <strong>Use here</strong> on any compatible leg in the plan.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-50 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-500" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Available providers</p>
            <p className="text-[11px] text-gray-400">{listings.length} listing{listings.length !== 1 ? 's' : ''} you can assign</p>
          </div>
        </div>

        {/* Transport */}
        {sortedTransport.length > 0 && (
          <div className={`px-4 py-3 ${stays.length > 0 ? 'border-b border-gray-50' : ''}`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Transport</p>
            <div className="space-y-2.5">
              {sortedTransport.map((l) => {
                const Icon     = TYPE_ICON[l.type] ?? Bus
                const colorCls = TYPE_COLOR[l.type] ?? 'bg-gray-100 text-gray-500'
                return (
                  <div key={l.id} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorCls}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{l.title}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{l.type.replace('_', ' ').toLowerCase()}{l.vehicle ? ` · ${l.vehicle}` : ''}</p>
                    </div>
                    <div className="text-right shrink-0 mr-1">
                      <p className="text-xs font-bold text-brand-600">{fmt(l.base_price)}</p>
                      <p className="text-[10px] text-gray-400">/person</p>
                    </div>
                    <AssignBtn listing={l} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Accommodation */}
        {stays.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Accommodation</p>
            <div className="space-y-2.5">
              {stays.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Hotel className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{l.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {l.city && <p className="text-[10px] text-gray-400">{l.city}</p>}
                      {l.stars && (
                        <div className="flex">
                          {Array.from({ length: l.stars }).map((_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 mr-1">
                    <p className="text-xs font-bold text-brand-600">{fmt(l.base_price)}</p>
                    <p className="text-[10px] text-gray-400">/night</p>
                  </div>
                  <AssignBtn listing={l} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!assigningListing && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
          Click <strong>Assign</strong> on any listing to pin it to a leg, or use <strong>Edit plan</strong> → <strong>Book provider</strong>.
          {travelStyle === 'LUXURY' && <> Luxury: tap <strong>Book car rental</strong> on transport legs.</>}
        </div>
      )}
    </div>
  )
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function ItineraryEditor({ plan: initialPlan, listings }: { plan: Plan; listings: Listing[] }) {
  const router = useRouter()
  const [plan, setPlan]                   = useState<Plan>(initialPlan)
  const [editing, setEditing]             = useState(false)
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [swapLeg, setSwapLeg]             = useState<{ dayId: string; leg: Leg } | null>(null)
  const [assigningListing, setAssigning]  = useState<Listing | null>(null)
  const [checkingOut, setCheckingOut]     = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const bookedLegCount = plan.days.flatMap((d) => d.legs).filter((l) => l.listing_id).length

  const handleCheckout = async () => {
    setCheckingOut(true); setCheckoutError('')
    const res = await fetch('/api/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan_id: plan.id }),
    })
    const data = await res.json()
    setCheckingOut(false)
    if (!res.ok) { setCheckoutError(data.error ?? 'Checkout failed'); return }
    router.push(`/bookings/${data.booking_id}`)
  }

  const badge = STYLE_BADGE[plan.travel_style]

  const updateLeg = useCallback((dayId: string, legId: string, patch: Partial<Leg>) => {
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.id !== dayId ? d : {
          ...d,
          legs: d.legs.map((l) => l.id !== legId ? l : { ...l, ...patch }),
        }
      ),
    }))
  }, [])

  const deleteLeg = useCallback((dayId: string, legId: string) => {
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.id !== dayId ? d : { ...d, legs: d.legs.filter((l) => l.id !== legId).map((l, i) => ({ ...l, order: i })) }
      ),
    }))
  }, [])

  const moveLeg = useCallback((dayId: string, legId: string, dir: -1 | 1) => {
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.id !== dayId) return d
        const legs   = [...d.legs]
        const idx    = legs.findIndex((l) => l.id === legId)
        const target = idx + dir
        if (target < 0 || target >= legs.length) return d
        ;[legs[idx], legs[target]] = [legs[target], legs[idx]]
        return { ...d, legs: legs.map((l, i) => ({ ...l, order: i })) }
      }),
    }))
  }, [])

  const swapListing = useCallback((dayId: string, leg: Leg, selected: Listing | null) => {
    updateLeg(dayId, leg.id, {
      listing_id: selected?.id ?? null,
      listing:    selected ? { id: selected.id, title: selected.title, type: selected.type, base_price: selected.base_price } : null,
      ...(selected ? { title: selected.title } : { title: leg.title }),
    })
    setSwapLeg(null)
  }, [updateLeg])

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/trip-plan/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: plan.days }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 2500) }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/plan/${plan.country.slug}`}
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 truncate">{plan.title}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{plan.country.name}
                </span>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-xs text-gray-400">{plan.duration_days} days</span>
                {badge && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {saved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
            {editing ? (
              <>
                <button onClick={() => { setPlan(initialPlan); setEditing(false) }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                <Edit3 className="w-3.5 h-3.5" /> Edit plan
              </button>
            )}
          </div>
        </div>

        {editing && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              {plan.travel_style === 'LUXURY'
                ? 'Luxury mode — tap "Book car rental" on any transport leg to assign a vehicle from our fleet.'
                : 'Editing mode — use "Book provider" or "Change provider" on any accommodation or transport leg.'}
            </p>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_296px] gap-8 items-start">

          {/* ── Main: days timeline ── */}
          <div className="space-y-8">
            {/* Assigning banner */}
            {assigningListing && (
              <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-2xl px-4 py-3">
                <span className="text-base shrink-0">📌</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-800 truncate">Assigning: {assigningListing.title}</p>
                  <p className="text-xs text-brand-600 mt-0.5">Click <strong>Use here</strong> on any highlighted leg below</p>
                </div>
                <button
                  onClick={() => setAssigning(null)}
                  className="text-brand-400 hover:text-brand-600 p-1 rounded-lg hover:bg-brand-100 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {plan.days.map((day) => (
              <div key={day.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {day.day_number}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{day.title}</p>
                    {day.notes && <p className="text-sm text-gray-500">{day.notes}</p>}
                  </div>
                </div>

                <div className="ml-5 border-l-2 border-gray-100 pl-8 space-y-3">
                  {day.legs.map((leg, legIdx) => {
                    const Icon = LEG_ICON[leg.type] ?? Landmark
                    const canSwap = editing && leg.type in SWAPPABLE_TYPES
                    const hasListing = !!leg.listing_id
                    const isLuxuryTransport = plan.travel_style === 'LUXURY' && leg.type === 'TRANSPORT'
                    const assignTargetType = assigningListing?.type === 'ACCOMMODATION' ? 'ACCOMMODATION' : 'TRANSPORT'
                    const canAssignHere = assigningListing !== null && leg.type === assignTargetType

                    return (
                      <div key={leg.id} className="relative">
                        <div className="absolute -left-[2.6rem] top-4 w-4 h-4 rounded-full bg-white border-2 border-brand-400 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        </div>

                        <div className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                          canAssignHere ? 'border-brand-300 ring-2 ring-brand-100' : editing ? 'border-brand-100 ring-1 ring-brand-50' : 'border-gray-100'
                        }`}>
                          {/* Provider badge */}
                          {hasListing && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Provider booked
                              </span>
                            </div>
                          )}

                          {/* Luxury prompt: nudge user to book if transport leg has no listing */}
                          {!hasListing && isLuxuryTransport && !editing && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Car className="w-3 h-3" /> Edit plan to book a car rental for this leg
                              </span>
                            </div>
                          )}

                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl shrink-0 ${
                              leg.type === 'PLACE' ? 'bg-brand-50 text-brand-600'
                              : leg.type === 'ACCOMMODATION' ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-0.5">
                                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{leg.title}</h3>
                                <div className="flex items-center gap-1 shrink-0">
                                  {leg.duration_minutes && (
                                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                      <Clock className="w-3 h-3" />{fmtDuration(leg.duration_minutes)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {leg.description && <p className="text-sm text-gray-600 leading-relaxed">{leg.description}</p>}
                              {leg.tip && (
                                <div className="mt-2 flex items-start gap-1.5 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700">
                                  <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  {leg.tip}
                                </div>
                              )}
                              {leg.listing && (
                                <div className="mt-2 text-xs text-gray-500">
                                  Provider: <span className="font-medium text-gray-700">{leg.listing.title}</span>
                                  {' · '}<span className="text-brand-600 font-semibold">{fmt(leg.listing.base_price)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Assign flow: Use here button */}
                          {canAssignHere && (
                            <div className="mt-3 pt-3 border-t border-brand-100">
                              <button
                                onClick={() => {
                                  swapListing(day.id, leg, assigningListing)
                                  setAssigning(null)
                                  setEditing(true)
                                }}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                              >
                                <Check className="w-3 h-3" /> Use here
                              </button>
                            </div>
                          )}

                          {/* Normal edit controls */}
                          {editing && !canAssignHere && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                              {canSwap && (
                                <button
                                  onClick={() => setSwapLeg({ dayId: day.id, leg })}
                                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                    plan.travel_style === 'LUXURY' && leg.type === 'TRANSPORT'
                                      ? 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                                      : 'text-brand-600 bg-brand-50 hover:bg-brand-100'
                                  }`}
                                >
                                  {plan.travel_style === 'LUXURY' && leg.type === 'TRANSPORT'
                                    ? <><Car className="w-3 h-3" />{hasListing ? 'Change car rental' : 'Book car rental'}</>
                                    : <><RefreshCw className="w-3 h-3" />{hasListing ? 'Change provider' : 'Book provider'}</>
                                  }
                                </button>
                              )}
                              <div className="flex items-center gap-1 ml-auto">
                                <button onClick={() => moveLeg(day.id, leg.id, -1)} disabled={legIdx === 0}
                                  className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 rounded-lg hover:bg-gray-50 transition-colors">
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => moveLeg(day.id, leg.id, 1)} disabled={legIdx === day.legs.length - 1}
                                  className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 rounded-lg hover:bg-gray-50 transition-colors">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteLeg(day.id, leg.id)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {editing && day.legs.length === 0 && (
                    <p className="text-sm text-gray-400 italic">All activities removed for this day.</p>
                  )}
                </div>
              </div>
            ))}

            <div className="pt-6 border-t border-gray-100 space-y-3">
              {checkoutError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {checkoutError}
                </p>
              )}

              {bookedLegCount > 0 && (
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-sm transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {checkingOut
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    : <><ShoppingCart className="w-4 h-4" /> Checkout {bookedLegCount} provider booking{bookedLegCount !== 1 ? 's' : ''}</>
                  }
                </button>
              )}

              <div className="flex items-center gap-4">
                <Link href={`/plan/${plan.country.slug}`} className="text-sm text-gray-500 hover:text-gray-700">
                  ← Generate new plan
                </Link>
                {bookedLegCount === 0 && (
                  <p className="text-xs text-gray-400">
                    Use <strong>Edit plan</strong> → <strong>Book provider</strong> to add bookings, then checkout.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar: available providers ── */}
          <div className="hidden xl:block sticky top-36">
            <ProviderSidebar
              listings={listings}
              travelStyle={plan.travel_style}
              assigningListing={assigningListing}
              onAssign={(listing) => {
                if (assigningListing?.id === listing.id) {
                  setAssigning(null)
                } else {
                  setAssigning(listing)
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Swap modal */}
      {swapLeg && (
        <SwapModal
          legType={swapLeg.leg.type}
          listings={listings}
          currentListingId={swapLeg.leg.listing_id}
          travelStyle={plan.travel_style}
          onSelect={(listing) => swapListing(swapLeg.dayId, swapLeg.leg, listing)}
          onClose={() => setSwapLeg(null)}
        />
      )}
    </div>
  )
}
