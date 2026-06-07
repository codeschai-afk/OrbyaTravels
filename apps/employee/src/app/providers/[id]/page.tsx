import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Package,
  CheckCircle2, XCircle, Clock, Users, Globe,
} from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  DRAFT:           'bg-gray-100 text-gray-500',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  CONFIRMED:       'bg-blue-100 text-blue-700',
  IN_PROGRESS:     'bg-purple-100 text-purple-700',
  COMPLETED:       'bg-emerald-100 text-emerald-700',
  CANCELLED:       'bg-red-100 text-red-600',
  REFUNDED:        'bg-gray-100 text-gray-500',
}

const V_STYLE: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
}

function fmt(price: unknown) {
  return Number(price).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default async function EmployeeProviderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (session.user.role !== 'EMPLOYEE' && session.user.role !== 'ADMIN')) redirect('/auth/signin')

  const provider = await prisma.providerProfile.findUnique({
    where: { id: params.id },
    include: {
      user:     { select: { email: true, name: true, created_at: true } },
      listings: {
        orderBy: { created_at: 'desc' },
        select:  { id: true, title: true, type: true, approval_status: true, base_price: true, created_at: true },
      },
      photos:   { select: { url: true }, take: 1 },
    },
  })
  if (!provider) notFound()

  const bookings = await prisma.booking.findMany({
    where:   { items: { some: { listing: { provider_id: provider.id } } } },
    include: {
      customer: { select: { name: true, email: true } },
      country:  { select: { name: true } },
      items: {
        where:   { listing: { provider_id: provider.id } },
        include: { listing: { select: { title: true, type: true } } },
      },
    },
    orderBy: { created_at: 'desc' },
    take:    50,
  })

  const totalRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.total_amount), 0)

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <Link href="/providers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All providers
      </Link>

      {/* Provider header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{provider.business_name}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${V_STYLE[provider.verification_status]}`}>
                {provider.verification_status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{provider.contact_email}</span>
              {provider.contact_phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{provider.contact_phone}</span>}
              {provider.city && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{provider.city}</span>}
              {provider.website && <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{provider.website}</span>}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {provider.service_types.map((s) => (
                <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize">
                  {s.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-brand-600">{fmt(totalRevenue)}</p>
            <p className="text-xs text-gray-400">confirmed revenue</p>
            <p className="text-sm text-gray-500 mt-1">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {provider.description && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">{provider.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Orders list */}
        <div>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            Order history
          </h2>
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No orders yet</p>
              <p className="text-sm text-gray-400 mt-1">Orders appear here when customers checkout a plan containing this provider&apos;s listings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{booking.customer.name ?? booking.customer.email}</p>
                      <p className="text-xs text-gray-400">
                        #{booking.id.slice(-8).toUpperCase()} · {booking.country.name} ·{' '}
                        {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[booking.status] ?? STATUS_STYLE.DRAFT}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                      <p className="text-sm font-bold text-gray-900 mt-1">{fmt(booking.total_amount)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {booking.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Package className="w-3 h-3 text-gray-300 shrink-0" />
                        {item.listing.title}
                        <span className="text-gray-300">·</span>
                        <span className="capitalize">{item.listing.type.replace('_', ' ').toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listings sidebar */}
        <div>
          <h2 className="font-bold text-gray-900 mb-4">Listings</h2>
          <div className="space-y-2">
            {provider.listings.length === 0 ? (
              <p className="text-sm text-gray-400">No listings yet.</p>
            ) : (
              provider.listings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate flex-1">{listing.title}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      listing.approval_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700'
                      : listing.approval_status === 'PENDING'  ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-600'
                    }`}>
                      {listing.approval_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 capitalize">{listing.type.replace('_', ' ').toLowerCase()}</span>
                    <span className="text-gray-300 text-xs">·</span>
                    <span className="text-xs font-semibold text-brand-600">{fmt(listing.base_price)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Approve / Reject quick actions */}
          {provider.verification_status === 'PENDING' && (
            <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-yellow-800">Provider awaiting verification</p>
              <div className="flex gap-2">
                <form action={`/api/providers/${provider.id}/approve`} method="POST" className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                </form>
                <form action={`/api/providers/${provider.id}/reject`} method="POST" className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-2 rounded-lg border border-red-100 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </form>
              </div>
              <p className="text-xs text-yellow-600">Or use the <Link href="/providers" className="underline">Providers list</Link> to approve with a note.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
