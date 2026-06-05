'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const schema = z.object({
  title:            z.string().min(3).max(120),
  description:      z.string().min(10),
  country_id:       z.string().min(1, 'Select a country'),
  base_price:       z.coerce.number().positive(),
  currency:         z.string().default('USD'),
  airline:          z.string().min(2, 'Required'),
  flight_number:    z.string().min(2, 'Required'),
  origin_city:      z.string().min(2, 'Required'),
  origin_iata:      z.string().length(3, 'Must be 3-letter IATA code').toUpperCase(),
  destination_city: z.string().min(2, 'Required'),
  destination_iata: z.string().length(3, 'Must be 3-letter IATA code').toUpperCase(),
  duration_minutes: z.coerce.number().int().positive('Required'),
})
type FormData = z.infer<typeof schema>

interface Props {
  countries: { id: string; name: string; iso_code: string }[]
  defaultValues?: Partial<FormData>
  listingId?: string
}

export function FlightForm({ countries, defaultValues, listingId }: Props) {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { currency: 'USD', ...defaultValues },
    })

  const onSubmit = async (data: FormData) => {
    const { airline, flight_number, origin_city, origin_iata, destination_city, destination_iata, duration_minutes, ...rest } = data
    const payload = {
      ...rest,
      type: 'FLIGHT',
      flight: { airline, flight_number, origin_city, origin_iata, destination_city, destination_iata, duration_minutes },
    }
    const res = listingId
      ? await fetch(`/api/listings/${listingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    if (res.ok) router.push('/flights')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Link href="/flights" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to flights
      </Link>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing title <span className="text-red-500">*</span></label>
          <input {...register('title')} placeholder="IndiGo Delhi to Goa"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
          <textarea {...register('description')} rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 resize-none bg-white" />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country <span className="text-red-500">*</span></label>
            <select {...register('country_id')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none">
              <option value="">Select country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.country_id && <p className="text-red-500 text-xs mt-1">{errors.country_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Base price (economy) <span className="text-red-500">*</span></label>
            <div className="flex">
              <select {...register('currency')} className="w-20 px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-200 text-sm bg-white outline-none">
                <option>USD</option><option>EUR</option><option>INR</option><option>GBP</option>
              </select>
              <input {...register('base_price')} type="number" step="0.01" placeholder="120"
                className="flex-1 px-4 py-2.5 rounded-r-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            </div>
            {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Flight details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Airline <span className="text-red-500">*</span></label>
            <input {...register('airline')} placeholder="IndiGo" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            {errors.airline && <p className="text-red-500 text-xs mt-1">{errors.airline.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Flight number <span className="text-red-500">*</span></label>
            <input {...register('flight_number')} placeholder="6E-2341" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            {errors.flight_number && <p className="text-red-500 text-xs mt-1">{errors.flight_number.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">From city <span className="text-red-500">*</span></label>
            <input {...register('origin_city')} placeholder="New Delhi" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">IATA <span className="text-red-500">*</span></label>
            <input {...register('origin_iata')} placeholder="DEL" maxLength={3} style={{ textTransform: 'uppercase' }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white font-mono" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">To city <span className="text-red-500">*</span></label>
            <input {...register('destination_city')} placeholder="Goa" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">IATA <span className="text-red-500">*</span></label>
            <input {...register('destination_iata')} placeholder="GOI" maxLength={3} style={{ textTransform: 'uppercase' }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white font-mono" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (mins) <span className="text-red-500">*</span></label>
            <input {...register('duration_minutes')} type="number" placeholder="90" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {listingId ? 'Save changes' : 'Submit for review'}
        </button>
        <Link href="/flights" className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</Link>
      </div>
    </form>
  )
}
