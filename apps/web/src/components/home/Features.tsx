import { Brain, Map, ShoppingCart, BadgeCheck, Heart, LayoutDashboard } from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Trip Planner',
    description:
      'Generate personalized day-by-day itineraries in seconds. Pick your destination and travel style — let AI handle the rest.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Map,
    title: 'Interactive Satellite Maps',
    description:
      'Explore curated places on stunning satellite imagery. Every attraction, restaurant, and hidden gem — mapped and discoverable.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: ShoppingCart,
    title: 'One-stop Booking',
    description:
      'Book hotels, flights, buses, trains, and car rentals in a single checkout. No more juggling a dozen tabs.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Providers',
    description:
      'Every hotel, transport operator, and car rental is reviewed and approved before listing. Book with full confidence.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Heart,
    title: 'Bucket List',
    description:
      'Save places you dream of visiting. Build your travel wishlist, mark what you\'ve explored, and share with others.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: LayoutDashboard,
    title: 'Trip Dashboard',
    description:
      'Every booking, itinerary, and travel document in one place. Track status updates and stay organised on the go.',
    color: 'bg-teal-50 text-teal-600',
  },
]

export function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-2">
            Why Orbya
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="text-gray-500 text-lg">
            Built for travellers who want to spend less time planning and more time exploring.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, title, description, color }) => (
            <div key={title} className="group p-6 rounded-2xl border border-gray-100 hover:border-brand-100 hover:shadow-md transition-all">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} mb-5`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
