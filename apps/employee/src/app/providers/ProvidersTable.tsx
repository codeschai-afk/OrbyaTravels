'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Photo  = { url: string; alt_text: string | null }
type Profile = {
  id: string
  business_name: string | null
  contact_email: string | null
  contact_phone: string | null
  city: string | null
  area: string | null
  service_types: string[]
  business_type: string
  registration_number: string | null
  verification_status: string
  verification_note: string | null
  created_at: Date
  user: { name: string | null; email: string | null }
  photos: Photo[]
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const

function RejectModal({ profileId, onClose, onDone }: { profileId: string; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!note.trim()) { setErr('Please provide a rejection note'); return }
    setLoading(true)
    const res = await fetch(`/api/providers/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED', note: note.trim() }),
    })
    if (!res.ok) { setErr('Action failed'); setLoading(false); return }
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Reject application</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500 mb-3">Provide a note explaining what needs to be fixed. The provider will see this message.</p>
          <textarea
            value={note} onChange={e => { setNote(e.target.value); setErr('') }} rows={4}
            placeholder="e.g. Photos are blurry, please upload clearer images of your premises."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400"
          />
          {err && <p className="text-red-500 text-sm mt-1">{err}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
            {loading ? 'Rejecting…' : 'Reject & notify'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProfileRow({ profile, onAction }: { profile: Profile; onAction: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const router = useRouter()

  const act = async (status: 'APPROVED' | 'REJECTED', note?: string) => {
    setLoading(status)
    const res = await fetch(`/api/providers/${profile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    })
    setLoading(null)
    if (res.ok) { onAction(profile.id, status); router.refresh() }
  }

  return (
    <>
      {rejectOpen && (
        <RejectModal
          profileId={profile.id}
          onClose={() => setRejectOpen(false)}
          onDone={() => { setRejectOpen(false); onAction(profile.id, 'REJECTED'); router.refresh() }}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-4">
          {/* Cover photo thumb */}
          {profile.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photos[0].url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 truncate">{profile.business_name ?? '—'}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[profile.verification_status]}`}>
                {profile.verification_status}
              </span>
            </div>
            <div className="text-sm text-gray-500">{profile.user.email}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {profile.city}{profile.area ? `, ${profile.area}` : ''} · {profile.service_types.join(', ')}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {profile.verification_status === 'PENDING' && (
              <>
                <button
                  onClick={() => act('APPROVED')}
                  disabled={loading !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading === 'APPROVED' ? 'Approving…' : 'Approve'}
                </button>
                <button
                  onClick={() => setRejectOpen(true)}
                  disabled={loading !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            <Link
              href={`/providers/${profile.id}`}
              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              title="View orders & details"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4 bg-gray-50/50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Contact</div>
                <div>{profile.contact_email}</div>
                {profile.contact_phone && <div className="text-gray-500">{profile.contact_phone}</div>}
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Business type</div>
                <div>{profile.business_type.replace('_', ' ')}</div>
                {profile.registration_number && <div className="font-mono text-gray-500">{profile.registration_number}</div>}
              </div>
            </div>

            {profile.verification_note && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <div className="text-xs text-red-500 font-medium mb-1">Previous rejection note</div>
                <div className="text-sm text-red-800">{profile.verification_note}</div>
              </div>
            )}

            {profile.photos.length > 0 && (
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Photos</div>
                <div className="flex gap-2 flex-wrap">
                  {profile.photos.map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={p.url} alt={p.alt_text ?? ''} className="w-20 h-16 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400">
              Applied {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export function ProvidersTable({ profiles }: { profiles: Profile[] }) {
  const [tab, setTab] = useState<typeof STATUS_TABS[number]>('PENDING')
  const [localProfiles, setLocalProfiles] = useState(profiles)

  const filtered = tab === 'ALL' ? localProfiles : localProfiles.filter(p => p.verification_status === tab)

  const handleAction = (id: string, status: string) => {
    setLocalProfiles(prev => prev.map(p => p.id === id ? { ...p, verification_status: status } : p))
  }

  return (
    <div>
      <div className="flex gap-1 mb-5">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            <span className="ml-1.5 text-xs opacity-70">{t === 'ALL' ? localProfiles.length : localProfiles.filter(p => p.verification_status === t).length}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No {tab.toLowerCase()} applications</p>
          </div>
        ) : (
          filtered.map(p => <ProfileRow key={p.id} profile={p} onAction={handleAction} />)
        )}
      </div>
    </div>
  )
}
