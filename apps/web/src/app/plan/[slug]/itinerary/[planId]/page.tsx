import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Lightbulb, Hotel, Bus, Train, Plane, Car, Landmark } from 'lucide-react'

const LEG_ICON: Record<string, React.FC<{ className?: string }>> = {
  PLACE:         Landmark,
  TRANSPORT:     Bus,
  ACCOMMODATION: Hotel,
}

const STYLE_BADGE: Record<string, { label: string; cls: string }> = {
  BUDGET:  { label: '💰 Budget',  cls: 'bg-green-100 text-green-700' },
  COMFORT: { label: '😊 Comfort', cls: 'bg-blue-100 text-blue-700' },
  LUXURY:  { label: '✨ Luxury',  cls: 'bg-purple-100 text-purple-700' },
}

export default async function ItineraryPage({ params }: { params: { slug: string; planId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const plan = await prisma.tripPlan.findUnique({
    where: { id: params.planId, user_id: session.user.id },
    include: {
      country: { select: { name: true, slug: true } },
      days:    { orderBy: { day_number: 'asc' }, include: { legs: { orderBy: { order: 'asc' } } } },
    },
  })
  if (!plan) notFound()

  const badge = STYLE_BADGE[plan.travel_style]

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link href={`/plan/${plan.country.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to {plan.country.name}
          </Link>
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" /> {plan.country.name}
                </span>
                <span className="text-sm text-gray-400">·</span>
                <span className="text-sm text-gray-500">{plan.duration_days} days</span>
                {badge && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {plan.days.map((day) => (
          <div key={day.id}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {day.day_number}
              </div>
              <div>
                <p className="font-bold text-gray-900">{day.title ?? `Day ${day.day_number}`}</p>
                {day.notes && <p className="text-sm text-gray-500">{day.notes}</p>}
              </div>
            </div>

            {/* Legs */}
            <div className="ml-5 border-l-2 border-gray-100 pl-8 space-y-4">
              {day.legs.map((leg, i) => {
                const Icon = LEG_ICON[leg.type] ?? Landmark
                return (
                  <div key={leg.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[2.6rem] top-3 w-4 h-4 rounded-full bg-white border-2 border-brand-400 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${leg.type === 'PLACE' ? 'bg-brand-50 text-brand-600' : leg.type === 'ACCOMMODATION' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm">{leg.title}</h3>
                            {leg.duration_minutes && (
                              <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                                <Clock className="w-3 h-3" />
                                {leg.duration_minutes < 60 ? `${leg.duration_minutes}m` : `${Math.floor(leg.duration_minutes / 60)}h${leg.duration_minutes % 60 > 0 ? ` ${leg.duration_minutes % 60}m` : ''}`}
                              </span>
                            )}
                          </div>
                          {leg.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">{leg.description}</p>
                          )}
                          {leg.tip && (
                            <div className="mt-2 flex items-start gap-1.5 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{leg.tip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Footer actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <Link href="/trips" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Browse listings →
          </Link>
          <Link href={`/plan/${plan.country.slug}`} className="text-sm text-gray-500 hover:text-gray-700">
            Generate new plan
          </Link>
        </div>
      </div>
    </div>
  )
}
