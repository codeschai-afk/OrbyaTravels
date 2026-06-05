'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const FEATURES = ['GPS', 'Bluetooth', 'USB charger', 'Child seat', 'Roof rack', 'Snow chains', 'Backup camera', 'Cruise control', 'Sunroof']

const schema = z.object({
  title:            z.string().min(3).max(120),
  description:      z.string().min(10),
  country_id:       z.string().min(1, 'Select a country'),
  base_price:       z.coerce.number().positive(),
  currency:         z.string().default('USD'),
  make:             z.string().min(1, 'Required'),
  model:            z.string().min(1, 'Required'),
  year:             z.coerce.number().int().min(2000).max(2030),
  transmission:     z.enum(['MANUAL', 'AUTOMATIC']),
  fuel_type:        z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']),
  seats:            z.coerce.number().int().min(1).max(20),
  price_per_day:    z.coerce.number().positive(),
  pickup_location:  z.string().min(3),
  dropoff_location: z.string().optional(),
  total_vehicles:   z.coerce.number().int().min(1).default(1),
  features:         z.array(z.string()).default([]),
})
type FormData = z.infer<typeof schema>

interface Props {
  countries: { id: string; name: string; iso_code: string }[]
  defaultValues?: Partial<FormData>
  listingId?: string
}

export function CarForm({ countries, defaultValues, listingId }: Props) {
  const router = useRouter()
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { currency: 'USD', transmission: 'AUTOMATIC', fuel_type: 'PETROL', total_vehicles: 1, features: [], ...defaultValues },
    })

  const selectedFeatures = watch('features') ?? []

  const toggleFeature = (f: string) => {
    const next = selectedFeatures.includes(f)
      ? selectedFeatures.filter(x => x !== f)
      : [...selectedFeatures, f]
    setValue('features', next)
  }

  const onSubmit = async (data: FormData) => {
    const { make, model, year, transmission, fuel_type, seats, price_per_day, pickup_location, dropoff_location, total_vehicles, features, ...rest } = data
    const payload = {
      ...rest,
      type: 'CAR_RENTAL',
      car_rental: { make, model, year, transmission, fuel_type, seats, price_per_day, pickup_location, dropoff_location, total_vehicles, features },
    }
    const res = listingId
      ? await fetch(`/api/listings/${listingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    if (res.ok) router.push('/cars')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Link href="/cars" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to cars
      </Link>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing title <span className="text-red-500">*</span></label>
          <input {...register('title')} placeholder="2023 Toyota Camry — Daily Rental"
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
            <select {...register('country_id')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white">
              <option value="">Select country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.country_id && <p className="text-red-500 text-xs mt-1">{errors.country_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price per day <span className="text-red-500">*</span></label>
            <div className="flex">
              <select {...register('currency')} className="w-20 px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-200 text-sm bg-white outline-none">
                <option>USD</option><option>EUR</option><option>INR</option><option>GBP</option>
              </select>
              <input {...register('price_per_day')} type="number" step="0.01" placeholder="50"
                className="flex-1 px-4 py-2.5 rounded-r-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            </div>
            {errors.price_per_day && <p className="text-red-500 text-xs mt-1">{errors.price_per_day.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Vehicle details</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Make <span className="text-red-500">*</span></label>
            <input {...register('make')} placeholder="Toyota" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Model <span className="text-red-500">*</span></label>
            <input {...register('model')} placeholder="Camry" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Year <span className="text-red-500">*</span></label>
            <input {...register('year')} type="number" placeholder="2023" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Transmission</label>
            <select {...register('transmission')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none">
              <option value="AUTOMATIC">Automatic</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fuel type</label>
            <select {...register('fuel_type')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none">
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="ELECTRIC">Electric</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Seats</label>
            <input {...register('seats')} type="number" placeholder="5" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup location <span className="text-red-500">*</span></label>
            <input {...register('pickup_location')} placeholder="Airport Terminal 1, Mumbai"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
            {errors.pickup_location && <p className="text-red-500 text-xs mt-1">{errors.pickup_location.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Drop-off location</label>
            <input {...register('dropoff_location')} placeholder="Same as pickup"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Total vehicles available</label>
          <input {...register('total_vehicles')} type="number" min="1" placeholder="1"
            className="w-32 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 bg-white" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Features</h3>
        <div className="flex flex-wrap gap-2">
          {FEATURES.map(f => (
            <button key={f} type="button" onClick={() => toggleFeature(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedFeatures.includes(f)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
              }`}>
              {f}
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
        <Link href="/cars" className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  )
}
