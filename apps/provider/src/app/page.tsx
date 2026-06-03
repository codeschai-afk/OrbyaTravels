import Link from 'next/link'

const SERVICE_TYPES = [
  { label: 'Hotels',      href: '/hotels',   icon: '🏨', desc: 'Accommodation listings' },
  { label: 'Car Rentals', href: '/cars',      icon: '🚗', desc: 'Vehicle rental listings' },
  { label: 'Buses',       href: '/buses',     icon: '🚌', desc: 'Bus route listings' },
  { label: 'Flights',     href: '/flights',   icon: '✈️',  desc: 'Flight listings' },
  { label: 'Trains',      href: '/trains',    icon: '🚂', desc: 'Train route listings' },
]

export default function ProviderDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage all your services in one place</p>
        </div>

        {/* Quick access by service type */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {SERVICE_TYPES.map(({ label, href, icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-400 hover:shadow-sm transition-all text-center"
            >
              <div className="text-3xl mb-2">{icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{label}</div>
              <div className="text-gray-400 text-xs mt-0.5">{desc}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/listings" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-brand-400 hover:shadow-sm transition-all">
            <div className="text-2xl font-bold text-gray-900 mb-1">All listings</div>
            <p className="text-sm text-gray-500">View and manage every listing across all service types</p>
          </Link>
          <Link href="/analytics" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-brand-400 hover:shadow-sm transition-all">
            <div className="text-2xl font-bold text-gray-900 mb-1">Analytics</div>
            <p className="text-sm text-gray-500">Revenue, bookings and performance metrics</p>
          </Link>
          <Link href="/payouts" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-brand-400 hover:shadow-sm transition-all">
            <div className="text-2xl font-bold text-gray-900 mb-1">Payouts</div>
            <p className="text-sm text-gray-500">Payout history and Stripe Connect status</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
