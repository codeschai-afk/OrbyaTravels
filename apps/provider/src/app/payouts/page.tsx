import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CreditCard, ExternalLink } from 'lucide-react'

export default async function PayoutsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="text-gray-500 text-sm mt-1">Connect your bank account to receive payments</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-lg">
        <div className="inline-flex p-3 rounded-2xl bg-brand-50 mb-5">
          <CreditCard className="w-6 h-6 text-brand-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Stripe Connect</h2>
        <p className="text-gray-500 text-sm mb-6">
          Orbya uses Stripe Connect to pay providers directly. Once you connect your account,
          you'll receive payouts within 2 business days of a completed booking.
        </p>

        <div className="space-y-3 mb-6">
          {[
            'No setup fees — free to connect',
            'Automatic payouts after checkout',
            'Full transaction history in Stripe dashboard',
            'Support for 40+ countries',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-emerald-500">✓</span> {f}
            </div>
          ))}
        </div>

        <button
          disabled
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-medium py-3 rounded-xl opacity-60 cursor-not-allowed"
        >
          <ExternalLink className="w-4 h-4" />
          Connect with Stripe — coming soon
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">
          Stripe Connect integration is being set up. You can still create listings in the meantime.
        </p>
      </div>
    </div>
  )
}
