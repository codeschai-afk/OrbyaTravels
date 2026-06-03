import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CountryEditForm } from './CountryEditForm'
import { CountryImages } from './CountryImages'

export default async function CountryDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/auth/signin')

  const country = await prisma.country.findUnique({
    where: { id: params.id },
    include: { hero_images: { orderBy: { sort_order: 'asc' } } },
  })

  if (!country) notFound()

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/countries" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to countries
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">{country.name}</h1>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Details</h2>
          <CountryEditForm country={country} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Hero images</h2>
          <CountryImages countryId={country.id} images={country.hero_images} />
        </div>
      </div>
    </div>
  )
}
