'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight } from 'lucide-react'

interface Country { id: string; name: string; slug: string; description: string | null }

export function DestinationPicker({ countries }: { countries: Country[] }) {
  const [value, setValue] = useState('')
  const router = useRouter()

  const selected = countries.find((c) => c.slug === value)

  return (
    <div className="space-y-4">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full appearance-none bg-white/10 backdrop-blur border border-white/20 text-white rounded-2xl pl-12 pr-12 py-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
        >
          <option value="" className="text-gray-900 bg-white">Select a destination…</option>
          {countries.map((c) => (
            <option key={c.slug} value={c.slug} className="text-gray-900 bg-white">{c.name}</option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 text-left">
          <p className="text-white font-semibold text-lg">{selected.name}</p>
          {selected.description && <p className="text-brand-200 text-sm mt-1">{selected.description}</p>}
        </div>
      )}

      <button
        disabled={!value}
        onClick={() => router.push(`/plan/${value}`)}
        className="w-full flex items-center justify-center gap-2 bg-white text-brand-700 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold py-4 rounded-2xl text-base transition-colors"
      >
        Start planning <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
