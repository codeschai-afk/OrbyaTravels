import { MapPin, Sliders, CreditCard, Plane } from 'lucide-react'

const STEPS = [
  {
    icon: MapPin,
    step: '01',
    title: 'Choose your destination',
    description:
      'Currently available in Nepal and India, with more destinations coming soon. Each country page shows travel advisories, best seasons, and available listings.',
    color: 'bg-brand-50 text-brand-600',
  },
  {
    icon: Sliders,
    step: '02',
    title: 'Build your trip',
    description:
      'Set your dates and traveller count. Browse hotels, flights, buses, trains and car rentals — mix and match to build your perfect itinerary.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: CreditCard,
    step: '03',
    title: 'Book and pay securely',
    description:
      'Review your trip summary and pay in one checkout. All bookings are protected and confirmed instantly.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Plane,
    step: '04',
    title: 'Travel with confidence',
    description:
      'Get real-time booking updates, e-tickets and itinerary details straight to your account. Support is available the whole way.',
    color: 'bg-purple-50 text-purple-600',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-2">
            Simple process
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How Orbya works
          </h2>
          <p className="text-gray-500 text-lg">
            From inspiration to packed bags in four easy steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map(({ icon: Icon, step, title, description, color }, i) => (
            <div key={step} className="relative">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gray-200 -translate-x-8 z-0" />
              )}

              <div className="relative z-10">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${color} mb-6`}>
                  <Icon className="w-7 h-7" />
                </div>

                {/* Step number */}
                <div className="text-xs font-bold text-gray-300 tracking-widest mb-2">{step}</div>

                <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
