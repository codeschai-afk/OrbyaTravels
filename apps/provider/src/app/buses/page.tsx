import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { Plus, Bus } from 'lucide-react'

const statusStyle: Record<string, string> = {
  PENDING:  'bg-orange-100 text-orange-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  FLAGGED:  'bg-yellow-100 text-yellow-700',
}

export default async function BusesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) redirect('/profile/setup')

  const buses = await prisma.listing.findMany({
    where: { provider_id: profile.id, type: 'BUS' },
    include: {
      country: { select: { name: true } },
      bus:     { select: { origin_city: true, destination_city: true, operator: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buses</h1>
          <p className="text-gray-500 text-sm mt-1">{buses.length} listing{buses.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/buses/new"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add route
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {buses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bus className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bus routes yet</p>
            <Link href="/buses/new" className="mt-4 inline-flex items-center gap-2 text-brand-600 text-sm font-medium hover:text-brand-700">
              <Plus className="w-4 h-4" /> Add route
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Route</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Operator</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Country</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Price / seat</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {buses.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{b.title}</div>
                    {b.bus && (
                      <div className="text-xs text-gray-400 mt-0.5">{b.bus.origin_city} → {b.bus.destination_city}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-600">{b.bus?.operator ?? '—'}</td>
                  <td className="px-4 py-4 text-gray-600">{b.country.name}</td>
                  <td className="px-4 py-4 font-medium text-gray-900">{b.currency} {Number(b.base_price).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[b.approval_status]}`}>
                      {b.approval_status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/buses/${b.slug}`} className="text-brand-600 hover:text-brand-700 text-xs font-medium">Edit →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
