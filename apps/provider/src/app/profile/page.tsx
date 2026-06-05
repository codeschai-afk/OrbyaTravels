import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { CheckCircle, Clock, XCircle, ArrowLeft, Edit } from 'lucide-react'

const STATUS_CONFIG = {
  APPROVED: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg:    'bg-emerald-50',
    border:'border-emerald-200',
    label: 'Verified & approved',
  },
  PENDING: {
    icon: Clock,
    color: 'text-amber-600',
    bg:    'bg-amber-50',
    border:'border-amber-200',
    label: 'Under review',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    bg:    'bg-red-50',
    border:'border-red-200',
    label: 'Changes requested',
  },
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({
    where: { user_id: session.user.id },
    include: { photos: { orderBy: { sort_order: 'asc' } } },
  })

  if (!profile) redirect('/profile/setup')

  const status  = profile.verification_status as keyof typeof STATUS_CONFIG
  const cfg     = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  const StatusIcon = cfg.icon

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <div className="flex items-start justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Business profile</h1>
        <Link href="/profile/setup"
          className="inline-flex items-center gap-2 border border-gray-200 hover:border-brand-400 text-sm font-medium px-4 py-2 rounded-xl text-gray-700 transition-colors">
          <Edit className="w-4 h-4" /> Edit &amp; resubmit
        </Link>
      </div>

      {/* Verification status banner */}
      <div className={`${cfg.bg} ${cfg.border} border rounded-2xl p-5 mb-6 flex items-start gap-3`}>
        <StatusIcon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.color}`} />
        <div>
          <div className={`font-semibold ${cfg.color}`}>{cfg.label}</div>
          {status === 'PENDING' && (
            <p className="text-amber-700 text-sm mt-0.5">Your application is being reviewed. This usually takes 1–2 business days.</p>
          )}
          {status === 'APPROVED' && (
            <p className="text-emerald-700 text-sm mt-0.5">Your business is verified and visible to customers.</p>
          )}
          {status === 'REJECTED' && profile.verification_note && (
            <div className="mt-2">
              <div className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Reviewer note</div>
              <p className="text-sm text-red-800">{profile.verification_note}</p>
              <Link href="/profile/setup"
                className="inline-flex items-center gap-1.5 mt-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                Update &amp; resubmit
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Profile details */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        <div className="px-6 py-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Business name</div>
          <div className="font-medium text-gray-900">{profile.business_name ?? '—'}</div>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Contact email</div>
            <div className="text-sm text-gray-800">{profile.contact_email ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Phone</div>
            <div className="text-sm text-gray-800">{profile.contact_phone ?? '—'}</div>
          </div>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">City</div>
            <div className="text-sm text-gray-800">{profile.city ?? '—'}{profile.area ? `, ${profile.area}` : ''}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Business type</div>
            <div className="text-sm text-gray-800">{profile.business_type.replace('_', ' ')}</div>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Services offered</div>
          <div className="flex gap-2 flex-wrap mt-1">
            {(profile.service_types as string[]).map(s => (
              <span key={s} className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">
                {s.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
        {profile.description && (
          <div className="px-6 py-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">About</div>
            <div className="text-sm text-gray-800">{profile.description}</div>
          </div>
        )}
      </div>

      {/* Photos */}
      {profile.photos.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Photos</h2>
          <div className="grid grid-cols-3 gap-3">
            {profile.photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={p.id} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                <img src={p.url} alt={p.alt_text ?? ''} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded-md font-medium">Cover</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
