import { prisma } from '@orbyatravel/db'
import { DestinationPicker } from './DestinationPicker'

export default async function PlanPage() {
  const countries = await prisma.country.findMany({
    where: { is_active: true },
    select: { id: true, name: true, slug: true, description: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-900 to-brand-700 flex flex-col items-center justify-center px-4 pt-16">
      <div className="max-w-xl w-full text-center">
        <p className="text-brand-300 uppercase tracking-widest text-xs font-semibold mb-4">Trip planner</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Where are you<br />dreaming of?
        </h1>
        <p className="text-brand-200 text-base mb-10">
          Pick a destination — we&apos;ll show you the best places, build your bucketlist, and generate a personalised itinerary.
        </p>
        <DestinationPicker countries={countries} />
      </div>
    </div>
  )
}
