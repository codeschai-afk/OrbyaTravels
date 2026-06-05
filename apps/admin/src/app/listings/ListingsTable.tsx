'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, Flag, RotateCcw, ChevronDown } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  PENDING:  'bg-orange-100 text-orange-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  FLAGGED:  'bg-yellow-100 text-yellow-700',
}

const TYPE_LABEL: Record<string, string> = {
  ACCOMMODATION: 'Hotel',
  FLIGHT:        'Flight',
  BUS:           'Bus',
  TRAIN:         'Train',
  CAR_RENTAL:    'Car rental',
}

type Listing = {
  id: string
  title: string
  type: string
  approval_status: string
  base_price: string | number
  currency: string
  created_at: Date | string
  provider: { business_name: string }
  country: { name: string }
  rejection_reason?: string | null
}

function ActionMenu({ listing, onUpdated }: { listing: Listing; onUpdated: (id: string, status: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [rejectModal, setRejectModal] = useState(false)
  const [reason, setReason] = useState('')

  const update = (status: string, extra?: Record<string, string>) => {
    startTransition(async () => {
      await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: status, ...extra }),
      })
      onUpdated(listing.id, status)
    })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        Actions <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
          {listing.approval_status !== 'APPROVED' && (
            <button onClick={() => update('APPROVED')}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          )}
          {listing.approval_status !== 'REJECTED' && (
            <button onClick={() => { setOpen(false); setRejectModal(true) }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          )}
          {listing.approval_status !== 'FLAGGED' && (
            <button onClick={() => update('FLAGGED')}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50">
              <Flag className="w-4 h-4" /> Flag
            </button>
          )}
          {listing.approval_status !== 'PENDING' && (
            <button onClick={() => update('PENDING')}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <RotateCcw className="w-4 h-4" /> Reset to pending
            </button>
          )}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-3">Reject listing</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason that will be shown to the provider.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Missing images, pricing unclear..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => update('REJECTED', { rejection_reason: reason })}
                disabled={!reason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 rounded-xl text-sm transition-colors"
              >
                Reject
              </button>
              <button onClick={() => setRejectModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ListingsTable({ listings: initial }: { listings: Listing[] }) {
  const [listings, setListings] = useState(initial)

  const handleUpdated = (id: string, status: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, approval_status: status } : l))
    )
  }

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 text-center py-16 text-gray-400">
        <p className="font-medium">No listings found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            <th className="text-left px-6 py-3 text-gray-500 font-medium">Listing</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Provider</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Country</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Price</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {listings.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50/50">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900 max-w-[220px] truncate">{l.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {new Date(l.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-4 py-4 text-gray-500">{TYPE_LABEL[l.type] ?? l.type}</td>
              <td className="px-4 py-4 text-gray-600 max-w-[140px] truncate">{l.provider.business_name}</td>
              <td className="px-4 py-4 text-gray-600">{l.country.name}</td>
              <td className="px-4 py-4 font-medium text-gray-900">
                {l.currency} {Number(l.base_price).toLocaleString()}
              </td>
              <td className="px-4 py-4">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[l.approval_status]}`}>
                  {l.approval_status}
                </span>
              </td>
              <td className="px-4 py-4">
                <ActionMenu listing={l} onUpdated={handleUpdated} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
