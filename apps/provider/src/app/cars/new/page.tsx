import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { CarForm } from '../CarForm'

export default async function NewCarPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PROVIDER') redirect('/auth/signin')

  const profile = await prisma.providerProfile.findUnique({ where: { user_id: session.user.id } })
  if (!profile) redirect('/profile/setup')

  const countries = await prisma.country.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, iso_code: true },
  })

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Add car rental</h1>
      <p className="text-gray-500 text-sm mb-8">New listings are reviewed before going live.</p>
      <CarForm countries={countries} />
    </div>
  )
}
