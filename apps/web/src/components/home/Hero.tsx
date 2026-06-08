'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'

const DESTINATIONS = ['India', 'Nepal']

export function Hero() {
  const [destination, setDestination] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    if (destination) router.push(`/trips?country=${destination.toLowerCase()}`)
    else router.push('/trips')
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/90 text-sm px-4 py-1.5 rounded-full mb-6">
          <MapPin className="w-3.5 h-3.5" />
          Nepal &amp; India — handpicked trips
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
          Your next adventure{' '}
          <span className="text-brand-300">starts here</span>
        </h1>

        <p className="text-lg sm:text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
          Plan complete trips with hotels, flights, buses, trains and car rentals — all in one place.
        </p>

        {/* Search bar */}
        <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
          <div className="flex items-center gap-3 flex-1 px-4">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="flex-1 py-3 text-gray-700 bg-transparent outline-none text-sm"
            >
              <option value="">Where do you want to go?</option>
              {DESTINATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-8 py-3 rounded-xl transition-colors text-sm shrink-0"
          >
            Explore trips
          </button>
        </div>

        {/* Destination pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
          {[
            { label: '🏔️ Nepal', desc: 'Himalayas · culture · trekking' },
            { label: '🌺 India', desc: 'heritage · wildlife · cuisine' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-white">
              <span className="font-semibold">{label}</span>
              <span className="text-white/50">·</span>
              <span className="text-white/70 text-xs">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 text-xs">
        <span>Scroll to explore</span>
        <div className="w-px h-8 bg-white/30" />
      </div>
    </section>
  )
}
