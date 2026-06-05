'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight, ChevronDown } from 'lucide-react'

interface Country {
  id: string
  name: string
  slug: string
  description: string | null
  travel_advisory: string
}

export function HeroDestinationPicker({
  countries,
  isSignedIn,
}: {
  countries: Country[]
  isSignedIn: boolean
}) {
  const [slug, setSlug] = useState('')
  const router = useRouter()
  const selected = countries.find((c) => c.slug === slug)

  const go = () => {
    if (!slug) return
    router.push(`/plan/${slug}`)
  }

  return (
    <div className="space-y-4">
      {/* Dropdown */}
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full appearance-none bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl pl-12 pr-10 py-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/30 transition-all cursor-pointer"
        >
          <option value="" className="bg-gray-900 text-gray-300">Choose your destination…</option>
          {countries.map((c) => (
            <option key={c.slug} value={c.slug} className="bg-gray-900 text-white">
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
      </div>

      {/* Country preview */}
      {selected && (
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-left">
          <p className="text-white font-semibold text-lg leading-tight">{selected.name}</p>
          {selected.description && (
            <p className="text-white/60 text-sm mt-1">{selected.description}</p>
          )}
          <span className="mt-2 inline-block text-xs text-white/50">
            {selected.travel_advisory === 'NONE' ? '✅ Safe to visit' : `⚠️ ${selected.travel_advisory.toLowerCase()} risk advisory`}
          </span>
        </div>
      )}

      {/* CTA */}
      <button
        disabled={!slug}
        onClick={go}
        className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed font-bold py-4 rounded-2xl text-base transition-all"
      >
        Explore {selected?.name ?? 'destination'}
        <ArrowRight className="w-5 h-5" />
      </button>

      {!isSignedIn && (
        <p className="text-white/40 text-xs text-center">
          <a href="/auth/signin" className="underline hover:text-white/60 transition-colors">Sign in</a>
          {' '}to save your bucket list and generate AI trip plans
        </p>
      )}
    </div>
  )
}
