'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Props {
  bookingId: string
  currentStatus: string
}

export function BookingActions({ bookingId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const update = async (newStatus: string, note: string) => {
    setLoading(newStatus)
    setError('')
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, note }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Update failed')
    } else {
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <div className="flex gap-3">
        {currentStatus === 'CONFIRMED' && (
          <button
            onClick={() => update('IN_PROGRESS', 'Service started by provider')}
            disabled={!!loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            {loading === 'IN_PROGRESS' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Mark in progress
          </button>
        )}
        {(currentStatus === 'CONFIRMED' || currentStatus === 'IN_PROGRESS') && (
          <button
            onClick={() => update('COMPLETED', 'Service completed by provider')}
            disabled={!!loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            {loading === 'COMPLETED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Mark completed
          </button>
        )}
        {currentStatus === 'CONFIRMED' && (
          <button
            onClick={() => update('CANCELLED', 'Cancelled by provider')}
            disabled={!!loading}
            className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            {loading === 'CANCELLED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Cancel booking
          </button>
        )}
      </div>
    </div>
  )
}
