import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { ListingsTable } from './ListingsTable'

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/auth/signin')

  const { status } = await searchParams
  const filter = ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'].includes(status ?? '')
    ? (status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED')
    : undefined

  const listings = await prisma.listing.findMany({
    where: filter ? { approval_status: filter } : undefined,
    include: {
      provider: { select: { business_name: true } },
      country: { select: { name: true } },
    },
    orderBy: [{ approval_status: 'asc' }, { created_at: 'desc' }],
    take: 200,
  })

  const counts = await prisma.listing.groupBy({
    by: ['approval_status'],
    _count: true,
  })

  const tally = Object.fromEntries(counts.map((c) => [c.approval_status, c._count]))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve provider listings</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { label: 'All', value: undefined },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Flagged', value: 'FLAGGED' },
        ].map(({ label, value }) => {
          const count = value ? (tally[value] ?? 0) : Object.values(tally).reduce((a, b) => a + b, 0)
          const active = (filter ?? undefined) === value
          return (
            <a
              key={label}
              href={value ? `?status=${value}` : '/listings'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-400'
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-100'}`}>
                {count}
              </span>
            </a>
          )
        })}
      </div>

      <ListingsTable listings={listings as any} />
    </div>
  )
}
