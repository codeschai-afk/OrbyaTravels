'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import { useState } from 'react'

const schema = z.object({
  name:            z.string().min(2),
  iso_code:        z.string().length(2).toUpperCase(),
  slug:            z.string().min(2).regex(/^[a-z0-9-]+$/),
  description:     z.string().optional(),
  travel_advisory: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
})
type FormData = z.infer<typeof schema>

interface Country {
  id: string
  name: string
  iso_code: string
  slug: string
  description: string | null
  travel_advisory: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
}

export function CountryEditForm({ country }: { country: Country }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        name: country.name,
        iso_code: country.iso_code,
        slug: country.slug,
        description: country.description ?? '',
        travel_advisory: country.travel_advisory,
      },
    })

  const onSubmit = async (data: FormData) => {
    await fetch(`/api/countries/${country.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
          <input {...register('name')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ISO code</label>
          <input {...register('iso_code')} maxLength={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 uppercase font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
          <input {...register('slug')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
          {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Travel advisory</label>
          <select {...register('travel_advisory')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white">
            <option value="NONE">None</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea {...register('description')} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 resize-none" />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting || !isDirty}
        className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
        {saved ? 'Saved' : 'Save changes'}
      </button>
    </form>
  )
}
