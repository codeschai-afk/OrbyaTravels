import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import { PlaceForm } from '../PlaceForm'

export default async function NewPlacePage({ searchParams }: { searchParams: { country?: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'EMPLOYEE') redirect('/auth/signin')

  const countries = await prisma.country.findMany({
    where: { is_active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Add new place</h1>
      <PlaceForm countries={countries} defaultCountryId={searchParams.country} />
    </div>
  )
}
