'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, Loader2, AlertTriangle } from 'lucide-react'

export function CancelBooking({ bookingId }: { bookingId: string }) {
  const router   = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const cancel = async () => {
    setLoading(true)
    const res = await fetch(`/api/bookings/${bookingId}`, { method: 'PATCH' })
    if (res.ok) router.refresh()
    else setLoading(false)
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
      >
        <XCircle className="w-4 h-4" /> Cancel booking
      </button>
    )
  }

  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-800 text-sm">Cancel this booking?</p>
          <p className="text-xs text-red-600 mt-1">This action cannot be undone. The booking will be marked as cancelled.</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={cancel}
          disabled={loading}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Yes, cancel it
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2.5 border border-gray-200 rounded-xl transition-colors"
        >
          Keep booking
        </button>
      </div>
    </div>
  )
}
