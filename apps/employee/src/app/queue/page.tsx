import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { QueueTable } from './QueueTable'

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') redirect('/auth/signin')

  const { status } = await searchParams
  const filter = ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'].includes(status ?? '')
    ? (status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED')
    : 'PENDING'

  const listings = await prisma.listing.findMany({
    where: { approval_status: filter },
    include: {
      provider: { select: { business_name: true, contact_email: true, is_verified: true } },
      country: { select: { name: true } },
      accommodation: { select: { city: true, stars: true } },
    },
    orderBy: { created_at: 'asc' },
    take: 100,
  })

  const counts = await prisma.listing.groupBy({ by: ['approval_status'], _count: true })
  const tally = Object.fromEntries(counts.map((c) => [c.approval_status, c._count]))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Listing approval queue</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve or reject provider listings</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { label: 'Pending',  value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Flagged',  value: 'FLAGGED' },
        ].map(({ label, value }) => {
          const count = tally[value] ?? 0
          const active = filter === value
          return (
            <a
              key={value}
              href={`?status=${value}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'
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

      <QueueTable listings={listings as any} />
    </div>
  )
}
