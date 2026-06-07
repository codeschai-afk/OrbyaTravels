import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { ArrowLeft, Globe, Mail, Phone, MapPin, Building2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { ApproveRejectButtons } from './ApproveRejectButtons'
import { PhotoGallery } from './PhotoGallery'

export default async function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/auth/signin')

  const { id } = await params

  const provider = await prisma.providerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, created_at: true } },
      photos: { orderBy: { sort_order: 'asc' } },
      listings: { select: { id: true, title: true, type: true, is_active: true, approval_status: true }, take: 10 },
      _count: { select: { listings: true } },
    },
  })

  if (!provider) notFound()

  const vstatus = provider.verification_status as string
  const statusConfig = {
    APPROVED: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    REJECTED: { color: 'text-red-700 bg-red-50 border-red-200', icon: XCircle },
    PENDING:  { color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock },
  }[vstatus] ?? { color: 'text-gray-700 bg-gray-50 border-gray-200', icon: Clock }
  const StatusIcon = statusConfig.icon

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/providers" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All providers
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          {provider.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={provider.logo_url} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border border-gray-100" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-gray-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{provider.business_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{provider.user.email}</p>
          </div>
        </div>

        <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {vstatus}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column — details */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          {provider.description && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{provider.description}</p>
            </div>
          )}

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Photos <span className="text-gray-400 font-normal">({provider.photos.length})</span>
            </h2>
            {provider.photos.length > 0 ? (
              <PhotoGallery photos={provider.photos.map((p) => p.url)} />
            ) : (
              <p className="text-sm text-gray-400">No photos uploaded</p>
            )}
          </div>

          {/* Listings */}
          {provider.listings.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Listings <span className="text-gray-400 font-normal">({provider._count.listings})</span>
              </h2>
              <div className="space-y-2">
                {provider.listings.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-800">{l.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{l.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        l.approval_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                        l.approval_status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{l.approval_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — meta + actions */}
        <div className="space-y-4">
          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Contact</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{provider.contact_email}</span>
              </div>
              {provider.contact_phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {provider.contact_phone}
                </div>
              )}
              {provider.website && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                    {provider.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {(provider.city || provider.area) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
              <h2 className="text-sm font-semibold text-gray-700">Location</h2>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span>{[provider.area, provider.city, provider.zip_code].filter(Boolean).join(', ')}</span>
              </div>
            </div>
          )}

          {/* Business info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">Business</h2>
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span>{provider.business_type}</span>
              </div>
              {provider.registration_number && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Reg. no.</span>
                  <span className="font-mono text-xs">{provider.registration_number}</span>
                </div>
              )}
              {provider.service_types.length > 0 && (
                <div className="pt-1">
                  <span className="text-gray-400 block mb-1.5">Services</span>
                  <div className="flex flex-wrap gap-1">
                    {provider.service_types.map((s) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registered */}
          <div className="text-xs text-gray-400 px-1">
            Registered {new Date(provider.user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>

          {/* Approve / Reject */}
          {vstatus !== 'APPROVED' && (
            <ApproveRejectButtons id={provider.id} currentStatus={vstatus} currentNote={provider.verification_note ?? ''} />
          )}
          {vstatus === 'APPROVED' && (
            <ApproveRejectButtons id={provider.id} currentStatus={vstatus} currentNote={provider.verification_note ?? ''} />
          )}
        </div>
      </div>
    </div>
  )
}
