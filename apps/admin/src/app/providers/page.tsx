import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import { VerifyToggle } from './VerifyToggle'

export default async function ProvidersPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/auth/signin')

  const providers = await prisma.providerProfile.findMany({
    include: {
      user: { select: { email: true, created_at: true } },
      _count: { select: { listings: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
        <p className="text-gray-500 text-sm mt-1">{providers.length} registered provider{providers.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {providers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No providers yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Business</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">City</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Listings</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {providers.map((p) => {
                const vstatus = p.verification_status as string
                const vbadge =
                  vstatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  vstatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                return (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <Link href={`/providers/${p.id}`} className="block hover:text-blue-600 transition-colors">
                      <div className="font-medium text-gray-900">{p.business_name}</div>
                      {p.website && <div className="text-gray-400 text-xs truncate max-w-[180px]">{p.website}</div>}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-xs">{p.contact_email}</td>
                  <td className="px-4 py-4 text-gray-500 text-xs">{p.city ?? '—'}</td>
                  <td className="px-4 py-4 text-gray-600">{p._count.listings}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${vbadge}`}>{vstatus}</span>
                  </td>
                  <td className="px-4 py-4">
                    <VerifyToggle id={p.id} verified={p.is_verified} />
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
