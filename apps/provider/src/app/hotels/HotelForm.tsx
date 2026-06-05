'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const AMENITIES = ['WiFi', 'Parking', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Room service', 'Air conditioning', 'Breakfast included']

const schema = z.object({
  title:          z.string().min(3, 'Required').max(120),
  description:    z.string().min(10, 'Min 10 characters'),
  country_id:     z.string().min(1, 'Select a country'),
  base_price:     z.coerce.number().positive('Enter a valid price'),
  currency:       z.string().default('USD'),
  address:        z.string().min(3, 'Required'),
  city:           z.string().min(2, 'Required'),
  stars:          z.coerce.number().int().min(1).max(5).optional(),
  amenities:      z.array(z.string()).default([]),
  check_in_time:  z.string().default('14:00'),
  check_out_time: z.string().default('11:00'),
})
type FormData = z.infer<typeof schema>

interface Props {
  countries: { id: string; name: string; iso_code: string }[]
  defaultValues?: Partial<FormData>
  listingId?: string
}

export function HotelForm({ countries, defaultValues, listingId }: Props) {
  const router = useRouter()
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { currency: 'USD', check_in_time: '14:00', check_out_time: '11:00', amenities: [], ...defaultValues },
    })

  const selectedAmenities = watch('amenities') ?? []

  const toggleAmenity = (a: string) => {
    const next = selectedAmenities.includes(a)
      ? selectedAmenities.filter(x => x !== a)
      : [...selectedAmenities, a]
    setValue('amenities', next)
  }

  const onSubmit = async (data: FormData) => {
    const { address, city, stars, amenities, check_in_time, check_out_time, ...rest } = data
    const payload = {
      ...rest,
      type: 'ACCOMMODATION',
      accommodation: { address, city, stars, amenities, check_in_time, check_out_time },
    }

    const res = listingId
      ? await fetch(`/api/listings/${listingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    if (res.ok) router.push('/hotels')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Link href="/hotels" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to hotels
      </Link>

      {/* Basic info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Hotel name <span className="text-red-500">*</span></label>
          <input {...register('title')} placeholder="Grand Palace Hotel"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
          <textarea {...register('description')} rows={4}
            placeholder="Describe the hotel, its highlights and what makes it special..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 resize-none bg-white" />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country <span className="text-red-500">*</span></label>
            <select {...register('country_id')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white">
              <option value="">Select country</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.iso_code})</option>
              ))}
            </select>
            {errors.country_id && <p className="text-red-500 text-xs mt-1">{errors.country_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Star rating</label>
            <select {...register('stars')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white">
              <option value="">Unrated</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price per night <span className="text-red-500">*</span></label>
            <div className="flex">
              <select {...register('currency')}
                className="w-20 px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-200 text-sm outline-none focus:border-brand-500 bg-white">
                <option>USD</option><option>EUR</option><option>INR</option><option>GBP</option>
              </select>
              <input {...register('base_price')} type="number" step="0.01" placeholder="150"
                className="flex-1 px-4 py-2.5 rounded-r-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            </div>
            {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in</label>
            <input {...register('check_in_time')} type="time"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Location</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address <span className="text-red-500">*</span></label>
            <input {...register('address')} placeholder="123 Beach Road"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
            <input {...register('city')} placeholder="Goa"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-out</label>
            <input {...register('check_out_time')} type="time"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedAmenities.includes(a)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
              }`}
            >
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
        <Link href="/hotels" className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  )
}
