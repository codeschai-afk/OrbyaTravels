import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { Plus, Hotel } from 'lucide-react'

const statusStyle: Record<string, string> = {
  PENDING:  'bg-orange-100 text-orange-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  FLAGGED:  'bg-yellow-100 text-yellow-700',
}

export default async function HotelsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) redirect('/profile/setup')

  const hotels = await prisma.listing.findMany({
    where: { provider_id: profile.id, type: 'ACCOMMODATION' },
    include: {
      country:       { select: { name: true } },
      accommodation: { select: { city: true, stars: true } },
      images:        { orderBy: { sort_order: 'asc' }, take: 1 },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
          <p className="text-gray-500 text-sm mt-1">{hotels.length} accommodation listing{hotels.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/hotels/new"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add hotel
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {hotels.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Hotel className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hotels yet</p>
            <p className="text-sm mt-1">Add your first accommodation listing</p>
            <Link href="/hotels/new" className="mt-4 inline-flex items-center gap-2 text-brand-600 text-sm font-medium hover:text-brand-700">
              <Plus className="w-4 h-4" /> Add hotel
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Hotel</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Location</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Price / night</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hotels.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {h.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.images[0].url} alt={h.title} className="w-12 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Hotel className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{h.title}</div>
                        {h.accommodation?.stars && <div className="text-yellow-500 text-xs">{'★'.repeat(h.accommodation.stars)}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{h.accommodation?.city}, {h.country.name}</td>
                  <td className="px-4 py-4 font-medium text-gray-900">{h.currency} {Number(h.base_price).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[h.approval_status]}`}>
                      {h.approval_status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/hotels/${h.slug}`} className="text-brand-600 hover:text-brand-700 text-xs font-medium">Edit →</Link>
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
