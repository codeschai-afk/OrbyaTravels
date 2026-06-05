import { prisma } from '@orbyatravel/db'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { HeroDestinationPicker } from './HeroDestinationPicker'

export default async function PlanPage() {
  const session = await auth()

  const countries = await prisma.country.findMany({
    where: { is_active: true },
    select: { id: true, name: true, slug: true, description: true, travel_advisory: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg px-6 text-center pt-20 pb-16">
        {session ? (
          <p className="text-white/70 text-sm font-medium mb-3">
            Welcome back, {session.user?.name?.split(' ')[0] ?? 'traveller'} 👋
          </p>
        ) : null}

        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-3 leading-tight tracking-tight">
          Where to<br />next?
        </h1>
        <p className="text-white/60 text-lg mb-10">
          Explore the map, discover hidden gems, and plan your perfect trip.
        </p>

        <HeroDestinationPicker countries={countries} isSignedIn={!!session} />
      </div>

      {/* Bottom scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-xs animate-bounce">↓ scroll</div>
    </div>
  )
}
