import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Hero({ destinationCount }: { destinationCount: number }) {
  return (
    <section className="relative min-h-[88vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {destinationCount > 0 && (
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/90 text-sm px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Now live in {destinationCount} destination{destinationCount !== 1 ? 's' : ''}
          </div>
        )}

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
          Plan your trip,<br />
          <span className="text-brand-300">not your spreadsheet</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
          AI-generated itineraries, curated places, and everything you need to book — hotels, flights, transport and car rentals — all in one platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/trips"
            className="w-full sm:w-auto px-8 py-4 bg-white text-brand-700 font-bold rounded-2xl hover:bg-brand-50 transition-colors text-sm"
          >
            Explore destinations
          </Link>
          <Link
            href="/plan"
            className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-400 border border-brand-400 text-white font-bold rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            Plan with AI <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 text-xs">
        <span>Discover features</span>
        <div className="w-px h-8 bg-white/20" />
      </div>
    </section>
  )
}
