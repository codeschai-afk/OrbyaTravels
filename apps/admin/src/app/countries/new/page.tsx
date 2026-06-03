'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const schema = z.object({
  name:            z.string().min(2, 'Required'),
  iso_code:        z.string().length(2, 'Must be 2 letters').toUpperCase(),
  slug:            z.string().min(2).regex(/^[a-z0-9-]+$/, 'lowercase, hyphens only'),
  description:     z.string().optional(),
  travel_advisory: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
})
type FormData = z.infer<typeof schema>

export default function NewCountryPage() {
  const router = useRouter()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { travel_advisory: 'NONE' } })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/countries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const { data: country } = await res.json()
      router.push(`/countries/${country.id}`)
    }
  }

  // Auto-generate slug from name
  const nameValue = watch('name')
  const autoSlug = () => {
    const slug = nameValue?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ?? ''
    setValue('slug', slug)
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/countries" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to countries
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Add country</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country name</label>
            <div className="flex gap-2">
              <input {...register('name')} placeholder="Japan" onBlur={autoSlug}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ISO code</label>
            <input {...register('iso_code')} placeholder="JP" maxLength={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 uppercase font-mono" />
            {errors.iso_code && <p className="text-red-500 text-xs mt-1">{errors.iso_code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
            <input {...register('slug')} placeholder="japan"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Travel advisory</label>
            <select {...register('travel_advisory')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white">
              <option value="NONE">None — Safe to travel</option>
              <option value="LOW">Low — Minor precautions</option>
              <option value="MEDIUM">Medium — Exercise caution</option>
              <option value="HIGH">High — Avoid non-essential travel</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <textarea {...register('description')} rows={3} placeholder="Brief overview shown to customers..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create country
          </button>
          <Link href="/countries" className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
