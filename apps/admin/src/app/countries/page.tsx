import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@orbyatravel/db'
import Link from 'next/link'
import { Plus, Globe, Image as ImageIcon } from 'lucide-react'
import { CountryToggle } from './CountryToggle'

export default async function CountriesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/auth/signin')

  const countries = await prisma.country.findMany({
    include: { hero_images: { orderBy: { sort_order: 'asc' }, take: 1 } },
    orderBy: { name: 'asc' },
  })

  const advisoryColour: Record<string, string> = {
    NONE:   'bg-green-100 text-green-700',
    LOW:    'bg-yellow-100 text-yellow-700',
    MEDIUM: 'bg-orange-100 text-orange-700',
    HIGH:   'bg-red-100 text-red-700',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Countries</h1>
          <p className="text-gray-500 text-sm mt-1">{countries.length} destinations configured</p>
        </div>
        <Link
          href="/countries/new"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add country
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Country</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">ISO</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Advisory</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Images</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Active</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Featured</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {countries.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {c.hero_images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.hero_images[0].url} alt={c.name} className="w-10 h-7 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-gray-400 text-xs">{c.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-500 font-mono text-xs">{c.iso_code}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${advisoryColour[c.travel_advisory]}`}>
                    {c.travel_advisory}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <ImageIcon className="w-3.5 h-3.5" /> {c.hero_images.length}
                  </span>
                </td>
                <td className="px-4 py-4"><CountryToggle id={c.id} field="is_active" value={c.is_active} /></td>
                <td className="px-4 py-4"><CountryToggle id={c.id} field="is_featured" value={c.is_featured} /></td>
                <td className="px-4 py-4">
                  <Link href={`/countries/${c.id}`} className="text-brand-600 hover:text-brand-700 text-xs font-medium">Edit →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {countries.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No countries yet</p>
            <p className="text-sm mt-1">Add your first destination to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
