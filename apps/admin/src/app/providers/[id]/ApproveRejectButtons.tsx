'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export function ApproveRejectButtons({
  id,
  currentStatus,
  currentNote,
}: {
  id: string
  currentStatus: string
  currentNote: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState(currentNote)
  const [showReject, setShowReject] = useState(false)

  const update = (status: 'APPROVED' | 'REJECTED') => {
    startTransition(async () => {
      await fetch(`/api/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: status === 'REJECTED' ? note : undefined }),
      })
      router.refresh()
      if (status === 'REJECTED') setShowReject(false)
    })
  }

  return (
    <div className="space-y-3">
      {currentStatus !== 'APPROVED' && (
        <button
          onClick={() => update('APPROVED')}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Approve provider
        </button>
      )}

      {currentStatus === 'APPROVED' && (
        <div className="text-center text-xs text-emerald-600 font-medium">Provider is approved</div>
      )}

      {!showReject && currentStatus !== 'REJECTED' && (
        <button
          onClick={() => setShowReject(true)}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>
      )}

      {(showReject || currentStatus === 'REJECTED') && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for rejection (sent to provider)..."
            rows={3}
            className="w-full text-sm border border-red-200 rounded-xl px-3 py-2 outline-none focus:border-red-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => update('REJECTED')}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
            >
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Confirm reject
            </button>
            {currentStatus !== 'REJECTED' && (
              <button
                onClick={() => setShowReject(false)}
                className="px-3 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
