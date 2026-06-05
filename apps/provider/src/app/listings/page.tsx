import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { Plus, List } from 'lucide-react'

const TYPE_LABEL: Record<string, string> = {
  ACCOMMODATION: 'Hotel',
  FLIGHT:        'Flight',
  BUS:           'Bus',
  TRAIN:         'Train',
  CAR_RENTAL:    'Car rental',
}

const TYPE_HREF: Record<string, string> = {
  ACCOMMODATION: 'hotels',
  FLIGHT:        'flights',
  BUS:           'buses',
  TRAIN:         'trains',
  CAR_RENTAL:    'cars',
}

const statusStyle: Record<string, string> = {
  PENDING:  'bg-orange-100 text-orange-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  FLAGGED:  'bg-yellow-100 text-yellow-700',
}

export default async function AllListingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) redirect('/profile/setup')

  const listings = await prisma.listing.findMany({
    where: { provider_id: profile.id },
    include: { country: { select: { name: true } } },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All listings</h1>
          <p className="text-gray-500 text-sm mt-1">{listings.length} listing{listings.length !== 1 ? 's' : ''} across all types</p>
        </div>
        <Link href="/hotels/new"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New listing
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <List className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No listings yet</p>
            <p className="text-sm mt-1">Start by adding a hotel, flight or car rental</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Listing</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Country</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Price</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{l.title}</td>
                  <td className="px-4 py-4 text-gray-500">{TYPE_LABEL[l.type]}</td>
                  <td className="px-4 py-4 text-gray-600">{l.country.name}</td>
                  <td className="px-4 py-4 text-gray-900">{l.currency} {Number(l.base_price).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[l.approval_status]}`}>
                      {l.approval_status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/${TYPE_HREF[l.type]}/${l.slug}`} className="text-brand-600 hover:text-brand-700 text-xs font-medium">
                      Edit →
                    </Link>
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
