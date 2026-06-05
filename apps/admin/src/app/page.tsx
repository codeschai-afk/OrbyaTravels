import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { Globe, Building2, Users, BookOpen } from 'lucide-react'

export default async function AdminDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/auth/signin')

  const [countries, providers, users, listings, bookings] = await Promise.all([
    prisma.country.count(),
    prisma.providerProfile.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.listing.count({ where: { approval_status: 'PENDING' } }),
    prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
  ])

  const stats = [
    { label: 'Countries',        value: countries, icon: Globe,     color: 'bg-blue-50 text-blue-600' },
    { label: 'Providers',        value: providers, icon: Building2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Customers',        value: users,     icon: Users,     color: 'bg-purple-50 text-purple-600' },
    { label: 'Active bookings',  value: bookings,  icon: BookOpen,  color: 'bg-brand-50 text-brand-600' },
    { label: 'Pending listings', value: listings,  icon: BookOpen,  color: 'bg-orange-50 text-orange-600' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {session.user.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-4`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Getting started</h2>
        <p className="text-sm text-gray-500">
          Add destination countries first — providers and customers need active countries to create listings and plan trips.
        </p>
        <a href="/countries" className="mt-4 inline-flex items-center gap-2 text-brand-600 text-sm font-medium hover:text-brand-700">
          Manage countries →
        </a>
      </div>
    </div>
  )
}
