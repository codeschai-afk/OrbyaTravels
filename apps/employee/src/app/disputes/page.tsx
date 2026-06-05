import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const TYPE_LABEL: Record<string, string> = {
  ACCOMMODATION: 'Hotel',
  FLIGHT:        'Flight',
  BUS:           'Bus',
  TRAIN:         'Train',
  CAR_RENTAL:    'Car rental',
}

export default async function DisputesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') redirect('/auth/signin')

  const flagged = await prisma.listing.findMany({
    where: { approval_status: 'FLAGGED' },
    include: {
      provider: { select: { business_name: true, contact_email: true } },
      country: { select: { name: true } },
    },
    orderBy: { updated_at: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Flagged listings</h1>
        <p className="text-gray-500 text-sm mt-1">
          {flagged.length} listing{flagged.length !== 1 ? 's' : ''} flagged for review
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {flagged.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No flagged listings</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Listing</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Provider</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Flag reason</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Flagged</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {flagged.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{l.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{l.country.name}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-gray-700 font-medium text-xs">{l.provider.business_name}</div>
                    <div className="text-gray-400 text-xs">{l.provider.contact_email}</div>
                  </td>
                  <td className="px-4 py-4 text-gray-500">{TYPE_LABEL[l.type] ?? l.type}</td>
                  <td className="px-4 py-4 text-yellow-700 max-w-[200px]">
                    <span className="text-xs">{l.flagged_reason ?? '—'}</span>
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">
                    {new Date(l.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/queue?status=FLAGGED`}
                      className="text-xs text-blue-600 font-medium hover:text-blue-700"
                    >
                      Review →
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
