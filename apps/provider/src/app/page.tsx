import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { Hotel, Car, Bus, Plane, Train, Plus } from 'lucide-react'

const SERVICE_TYPES = [
  { label: 'Hotels',      href: '/hotels',   icon: Hotel },
  { label: 'Car rentals', href: '/cars',      icon: Car },
  { label: 'Buses',       href: '/buses',     icon: Bus },
  { label: 'Flights',     href: '/flights',   icon: Plane },
  { label: 'Trains',      href: '/trains',    icon: Train },
]

export default async function ProviderDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({
    where: { user_id: session.user.id },
  })

  if (!profile) redirect('/profile/setup')

  // Show a full-screen message for rejected/pending verification
  if (profile.verification_status === 'REJECTED') {
    return (
      <div className="p-8 max-w-xl">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h2 className="font-bold text-red-800 text-lg mb-2">Application rejected</h2>
          <p className="text-red-700 text-sm mb-4">
            Your provider application was reviewed and needs changes before approval.
          </p>
          {profile.verification_note && (
            <div className="bg-white border border-red-200 rounded-xl p-4 mb-4">
              <div className="text-xs font-semibold text-red-500 mb-1 uppercase tracking-wide">Reviewer note</div>
              <p className="text-sm text-gray-800">{profile.verification_note}</p>
            </div>
          )}
          <Link href="/profile/setup"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            Update &amp; resubmit
          </Link>
        </div>
      </div>
    )
  }

  if (profile.verification_status === 'PENDING') {
    return (
      <div className="p-8 max-w-xl">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="font-bold text-amber-800 text-lg mb-2">Application under review</h2>
          <p className="text-amber-700 text-sm">
            Your provider application has been submitted and is being reviewed by our team. We&apos;ll notify you once it&apos;s approved. This usually takes 1–2 business days.
          </p>
          <div className="mt-4 text-sm text-amber-600">
            Business: <span className="font-medium">{profile.business_name}</span>
          </div>
        </div>
      </div>
    )
  }

  const [total, approved, pending] = await Promise.all([
    prisma.listing.count({ where: { provider_id: profile.id } }),
    prisma.listing.count({ where: { provider_id: profile.id, approval_status: 'APPROVED' } }),
    prisma.listing.count({ where: { provider_id: profile.id, approval_status: 'PENDING' } }),
  ])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.business_name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            <span className="text-emerald-600 font-medium">✓ Verified provider</span>
          </p>
        </div>
        <Link
          href="/hotels/new"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New listing
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total listings', value: total, color: 'text-gray-900' },
          { label: 'Approved',       value: approved, color: 'text-emerald-600' },
          { label: 'Pending review', value: pending, color: 'text-orange-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Add a listing</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SERVICE_TYPES.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={`${href}/new`}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-400 hover:shadow-sm transition-all text-center group"
            >
              <Icon className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-brand-600 transition-colors" />
              <div className="font-medium text-gray-700 text-sm">{label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/listings" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-400 hover:shadow-sm transition-all">
          <div className="font-semibold text-gray-900 mb-1">All listings</div>
          <p className="text-sm text-gray-500">View and manage every listing you have created</p>
        </Link>
        <Link href="/profile" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-400 hover:shadow-sm transition-all">
          <div className="font-semibold text-gray-900 mb-1">Business profile</div>
          <p className="text-sm text-gray-500">Update your business info and contact details</p>
        </Link>
      </div>
    </div>
  )
}
