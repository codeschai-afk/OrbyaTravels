'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Calendar, Users, ChevronDown, CreditCard } from 'lucide-react'

interface RoomType {
  id: string; name: string; capacity: number; price_per_night: number
}

interface FlightSchedule {
  id: string; departure_at: string; arrival_at: string
  price_economy: number; price_business: number; price_first: number
  seats_economy: number; seats_business: number; seats_first: number
}

interface TransportSchedule {
  id: string; departure_at: string; arrival_at: string
  price_per_seat: number; seat_class: string; total_seats: number
}

interface BookingListing {
  id: string
  type: string
  base_price: number
  country_id: string
  currency: string
  slug: string
  room_types: RoomType[]
  flight_schedules: FlightSchedule[]
  transport_schedules: TransportSchedule[]
  price_per_day: number | null
}

function fmt(price: number) {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function diffDays(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

const TODAY = new Date().toISOString().split('T')[0]

const SEAT_CLASSES = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First' },
]

function Stepper({ value, onChange, min = 1, max = 12 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-lg leading-none"
        disabled={value <= min}
      >
        −
      </button>
      <span className="font-semibold text-gray-900 w-6 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-lg leading-none"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  )
}

export function BookingSection({ listing }: { listing: BookingListing }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Accommodation
  const [roomTypeId, setRoomTypeId] = useState(listing.room_types[0]?.id ?? '')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  // Car rental
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')

  // Flight
  const [flightScheduleId, setFlightScheduleId] = useState(listing.flight_schedules[0]?.id ?? '')
  const [seatClass, setSeatClass] = useState('ECONOMY')
  const [passengers, setPassengers] = useState(1)

  // Transport (bus / train)
  const [transportScheduleId, setTransportScheduleId] = useState(listing.transport_schedules[0]?.id ?? '')
  const [seats, setSeats] = useState(1)

  // --- Price calculation ---
  const selectedRoom = listing.room_types.find((r) => r.id === roomTypeId) ?? listing.room_types[0]
  const selectedFlight = listing.flight_schedules.find((s) => s.id === flightScheduleId) ?? listing.flight_schedules[0]
  const selectedTransport = listing.transport_schedules.find((s) => s.id === transportScheduleId) ?? listing.transport_schedules[0]

  let unitPrice = listing.base_price
  let total = 0
  let priceLabel = ''

  if (listing.type === 'ACCOMMODATION') {
    unitPrice = selectedRoom?.price_per_night ?? listing.base_price
    const nights = checkIn && checkOut ? diffDays(checkIn, checkOut) : 0
    total = nights > 0 ? unitPrice * nights * guests : 0
    priceLabel = nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''} × ${fmt(unitPrice)} × ${guests} guest${guests !== 1 ? 's' : ''}` : ''
  } else if (listing.type === 'CAR_RENTAL') {
    unitPrice = listing.price_per_day ?? listing.base_price
    const days = pickupDate && returnDate ? diffDays(pickupDate, returnDate) : 0
    total = days > 0 ? unitPrice * days : 0
    priceLabel = days > 0 ? `${days} day${days !== 1 ? 's' : ''} × ${fmt(unitPrice)}/day` : ''
  } else if (listing.type === 'FLIGHT') {
    const classPrices: Record<string, number> = {
      ECONOMY: selectedFlight?.price_economy ?? listing.base_price,
      BUSINESS: selectedFlight?.price_business ?? listing.base_price * 2.5,
      FIRST: selectedFlight?.price_first ?? listing.base_price * 4,
    }
    unitPrice = classPrices[seatClass] ?? listing.base_price
    total = unitPrice * passengers
    priceLabel = `${passengers} passenger${passengers !== 1 ? 's' : ''} × ${fmt(unitPrice)}`
  } else {
    unitPrice = selectedTransport?.price_per_seat ?? listing.base_price
    total = unitPrice * seats
    priceLabel = `${seats} seat${seats !== 1 ? 's' : ''} × ${fmt(unitPrice)}`
  }

  const canSubmit = (() => {
    if (listing.type === 'ACCOMMODATION') return !!(checkIn && checkOut && diffDays(checkIn, checkOut) > 0)
    if (listing.type === 'CAR_RENTAL') return !!(pickupDate && returnDate && diffDays(pickupDate, returnDate) > 0)
    return true
  })()

  const handleBook = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')

    const body: Record<string, unknown> = {
      listing_id: listing.id,
      country_id: listing.country_id,
      item_type: listing.type,
    }

    if (listing.type === 'ACCOMMODATION') {
      body.check_in_date = checkIn
      body.check_out_date = checkOut
      body.room_type_id = roomTypeId || null
      body.quantity = guests
    } else if (listing.type === 'CAR_RENTAL') {
      body.pickup_date = pickupDate
      body.return_date = returnDate
    } else if (listing.type === 'FLIGHT') {
      body.flight_schedule_id = flightScheduleId || null
      body.seat_class = seatClass
      body.passenger_count = passengers
    } else {
      body.transport_schedule_id = transportScheduleId || null
      body.passenger_count = seats
    }

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Booking failed. Please try again.')
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push(`/bookings/${data.booking_id}`), 900)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <CheckCircle className="w-12 h-12 text-emerald-500" />
        <p className="font-semibold text-gray-900">Booking confirmed!</p>
        <p className="text-sm text-gray-500">Redirecting to your booking…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── ACCOMMODATION ── */}
      {listing.type === 'ACCOMMODATION' && (
        <>
          {listing.room_types.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Room type</label>
              <div className="relative">
                <select
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {listing.room_types.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} — {fmt(rt.price_per_night)}/night (up to {rt.capacity} guests)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Check-in</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="date" min={TODAY} value={checkIn}
                  onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut('') }}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Check-out</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="date" min={checkIn || TODAY} value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Guests
            </label>
            <Stepper value={guests} onChange={setGuests} max={selectedRoom?.capacity ?? 8} />
          </div>
        </>
      )}

      {/* ── CAR RENTAL ── */}
      {listing.type === 'CAR_RENTAL' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Pickup date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="date" min={TODAY} value={pickupDate}
                onChange={(e) => { setPickupDate(e.target.value); if (returnDate && e.target.value >= returnDate) setReturnDate('') }}
                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Return date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="date" min={pickupDate || TODAY} value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </div>
      )}

      {/* ── FLIGHT ── */}
      {listing.type === 'FLIGHT' && (
        <>
          {listing.flight_schedules.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Departure</label>
              <div className="relative">
                <select value={flightScheduleId} onChange={(e) => setFlightScheduleId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {listing.flight_schedules.map((s) => (
                    <option key={s.id} value={s.id}>{fmtDate(s.departure_at)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Seat class</label>
            <div className="grid grid-cols-3 gap-2">
              {SEAT_CLASSES.map((sc) => {
                const price = sc.value === 'ECONOMY' ? (selectedFlight?.price_economy ?? listing.base_price)
                  : sc.value === 'BUSINESS' ? (selectedFlight?.price_business ?? listing.base_price * 2.5)
                  : (selectedFlight?.price_first ?? listing.base_price * 4)
                return (
                  <button key={sc.value} type="button" onClick={() => setSeatClass(sc.value)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${seatClass === sc.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {sc.label}
                    <div className="text-brand-600 font-semibold mt-0.5">{fmt(price)}</div>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Passengers
            </label>
            <Stepper value={passengers} onChange={setPassengers} />
          </div>
        </>
      )}

      {/* ── BUS / TRAIN ── */}
      {(listing.type === 'BUS' || listing.type === 'TRAIN') && (
        <>
          {listing.transport_schedules.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Departure</label>
              <div className="relative">
                <select value={transportScheduleId} onChange={(e) => setTransportScheduleId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {listing.transport_schedules.map((s) => (
                    <option key={s.id} value={s.id}>{fmtDate(s.departure_at)} — {fmt(s.price_per_seat)}/seat</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Seats
            </label>
            <Stepper value={seats} onChange={setSeats} />
          </div>
        </>
      )}

      {/* Price breakdown */}
      {total > 0 && priceLabel && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{priceLabel}</span>
            <span className="font-medium">{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-gray-900 border-t border-gray-200 pt-1.5 mt-1.5">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <button
        onClick={handleBook}
        disabled={loading || !canSubmit}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
          : <><CreditCard className="w-4 h-4" /> Confirm booking</>}
      </button>
      <p className="text-xs text-gray-400 text-center">Free cancellation · No hidden fees</p>
    </div>
  )
}
