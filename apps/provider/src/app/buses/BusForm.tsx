'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const BUS_AMENITIES = ['WiFi', 'AC', 'Charging ports', 'Reclining seats', 'TV screens', 'Toilet', 'Luggage compartment', 'Snacks']

const schema = z.object({
  title:            z.string().min(3).max(120),
  description:      z.string().min(10),
  country_id:       z.string().min(1, 'Select a country'),
  base_price:       z.coerce.number().positive(),
  currency:         z.string().default('USD'),
  operator:         z.string().min(1, 'Required'),
  origin_city:      z.string().min(2, 'Required'),
  destination_city: z.string().min(2, 'Required'),
  duration_minutes: z.coerce.number().int().positive('Required'),
  bus_type:         z.string().min(1, 'Required'),
  amenities:        z.array(z.string()).default([]),
})
type FormData = z.infer<typeof schema>

interface Props {
  countries: { id: string; name: string; iso_code: string }[]
  defaultValues?: Partial<FormData>
  listingId?: string
}

export function BusForm({ countries, defaultValues, listingId }: Props) {
  const router = useRouter()
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { currency: 'USD', amenities: [], ...defaultValues },
    })

  const selectedAmenities = watch('amenities') ?? []

  const toggleAmenity = (a: string) => {
    const next = selectedAmenities.includes(a) ? selectedAmenities.filter(x => x !== a) : [...selectedAmenities, a]
    setValue('amenities', next)
  }

  const onSubmit = async (data: FormData) => {
    const { operator, origin_city, destination_city, duration_minutes, bus_type, amenities, ...rest } = data
    const payload = {
      ...rest,
      type: 'BUS',
      bus: { operator, origin_city, destination_city, duration_minutes, bus_type, amenities },
    }
    const res = listingId
      ? await fetch(`/api/listings/${listingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    if (res.ok) router.push('/buses')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Link href="/buses" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to buses
      </Link>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing title <span className="text-red-500">*</span></label>
          <input {...register('title')} placeholder="Mumbai to Pune Express Bus"
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price per seat <span className="text-red-500">*</span></label>
            <div className="flex">
              <select {...register('currency')} className="w-20 px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-200 text-sm bg-white outline-none">
                <option>USD</option><option>EUR</option><option>INR</option><option>GBP</option>
              </select>
              <input {...register('base_price')} type="number" step="0.01" placeholder="25"
                className="flex-1 px-4 py-2.5 rounded-r-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            </div>
            {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Route details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Operator <span className="text-red-500">*</span></label>
            <input {...register('operator')} placeholder="RedBus Express" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            {errors.operator && <p className="text-red-500 text-xs mt-1">{errors.operator.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bus type <span className="text-red-500">*</span></label>
            <input {...register('bus_type')} placeholder="Sleeper / Seater / Volvo" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">From city <span className="text-red-500">*</span></label>
            <input {...register('origin_city')} placeholder="Mumbai" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">To city <span className="text-red-500">*</span></label>
            <input {...register('destination_city')} placeholder="Pune" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (mins) <span className="text-red-500">*</span></label>
            <input {...register('duration_minutes')} type="number" placeholder="180" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {BUS_AMENITIES.map(a => (
            <button key={a} type="button" onClick={() => toggleAmenity(a)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedAmenities.includes(a)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
              }`}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {listingId ? 'Save changes' : 'Submit for review'}
        </button>
        <Link href="/buses" className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</Link>
      </div>
    </form>
  )
}
