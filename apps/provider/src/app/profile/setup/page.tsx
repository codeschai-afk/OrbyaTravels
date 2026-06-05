'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Globe, Hotel, Car, Bus, Plane, Train, Upload, X, Loader2, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'

// ── Step schemas ──────────────────────────────────────────────────────────────

const step1Schema = z.object({
  service_types: z.array(z.string()).min(1, 'Select at least one service type'),
})

const step2Schema = z.object({
  business_name:  z.string().min(2, 'Required'),
  contact_email:  z.string().email('Valid email required'),
  contact_phone:  z.string().optional(),
  website:        z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description:    z.string().optional(),
})

const step3Schema = z.object({
  business_type:       z.enum(['PERSONAL', 'VAT_REGISTERED', 'PAN_REGISTERED']),
  registration_number: z.string().optional(),
}).refine(d => d.business_type === 'PERSONAL' || !!d.registration_number?.trim(), {
  message: 'Registration number is required for VAT/PAN registered businesses',
  path: ['registration_number'],
})

const step4Schema = z.object({
  city:      z.string().min(2, 'City is required'),
  area:      z.string().optional(),
  zip_code:  z.string().optional(),
  country_display: z.string().optional(),
})

// ── Service type options ──────────────────────────────────────────────────────

const SERVICE_TYPES = [
  { value: 'ACCOMMODATION', label: 'Hotels & Accommodation', icon: Hotel },
  { value: 'CAR_RENTAL',    label: 'Car Rentals',            icon: Car },
  { value: 'BUS',           label: 'Bus Routes',             icon: Bus },
  { value: 'FLIGHT',        label: 'Flights',                icon: Plane },
  { value: 'TRAIN',         label: 'Trains',                 icon: Train },
]

const BIZ_TYPES = [
  { value: 'PERSONAL',       label: 'Personal / Sole proprietor', desc: 'Individual operating without formal registration' },
  { value: 'VAT_REGISTERED', label: 'VAT registered',            desc: 'Business registered for Value Added Tax' },
  { value: 'PAN_REGISTERED', label: 'PAN registered',            desc: 'Business with PAN / tax registration number' },
]

const STEPS = ['Services', 'Business info', 'Registration', 'Location', 'Photos']

// ── Photo upload component ────────────────────────────────────────────────────

type UploadedPhoto = { url: string; cloudinary_id?: string; preview: string }

function PhotoUploader({ photos, onChange }: {
  photos: UploadedPhoto[]
  onChange: (p: UploadedPhoto[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = useCallback(async (files: FileList) => {
    const remaining = 7 - photos.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) return

    setUploading(true)
    setError('')
    try {
      const results = await Promise.all(
        toUpload.map(async (file) => {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!res.ok) throw new Error('Upload failed')
          const { url, public_id } = await res.json()
          return { url, cloudinary_id: public_id, preview: URL.createObjectURL(file) }
        })
      )
      onChange([...photos, ...results])
    } catch {
      setError('One or more uploads failed. Try again.')
    } finally {
      setUploading(false)
    }
  }, [photos, onChange])

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Upload 2–7 photos of your business. These will be shown to customers.</p>

      <div className="grid grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview || p.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded-md font-medium">Cover</span>
            )}
          </div>
        ))}

        {photos.length < 7 && (
          <label className={`aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 flex flex-col items-center justify-center cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? <Loader2 className="w-6 h-6 text-gray-400 animate-spin" /> : <Upload className="w-6 h-6 text-gray-400" />}
            <span className="text-xs text-gray-400 mt-1.5">{uploading ? 'Uploading…' : 'Add photo'}</span>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          </label>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <p className="text-xs text-gray-400">{photos.length} / 7 photos · minimum 2 required</p>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function ProfileSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Accumulated data across steps
  const [serviceTypes, setServiceTypes] = useState<string[]>([])
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])

  const step1 = useForm({ resolver: zodResolver(step1Schema), defaultValues: { service_types: [] as string[] } })
  const step2 = useForm({ resolver: zodResolver(step2Schema), defaultValues: { business_name: '', contact_email: '', contact_phone: '', website: '', description: '' } })
  const step3 = useForm({ resolver: zodResolver(step3Schema), defaultValues: { business_type: 'PERSONAL' as const, registration_number: '' } })
  const step4 = useForm({ resolver: zodResolver(step4Schema), defaultValues: { city: '', area: '', zip_code: '', country_display: '' } })

  const bizType = step3.watch('business_type') as string

  const goNext = async () => {
    const valid = await [step1, step2, step3, step4][step]?.trigger()
    if (!valid) return
    if (step < 4) setStep(s => s + 1)
  }

  const toggleService = (value: string) => {
    const next = serviceTypes.includes(value)
      ? serviceTypes.filter(s => s !== value)
      : [...serviceTypes, value]
    setServiceTypes(next)
    step1.setValue('service_types', next)
    step1.trigger('service_types')
  }

  const handleSubmit = async () => {
    if (photos.length < 2) { setSubmitError('Upload at least 2 photos'); return }

    setSubmitting(true)
    setSubmitError('')
    try {
      const s2 = step2.getValues()
      const s3 = step3.getValues()
      const s4 = step4.getValues()

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...s2,
          service_types: serviceTypes,
          business_type: s3.business_type,
          registration_number: s3.registration_number || undefined,
          city: s4.city,
          area: s4.area || undefined,
          zip_code: s4.zip_code || undefined,
          photos: photos.map(p => ({ url: p.url, cloudinary_id: p.cloudinary_id })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setSubmitError(JSON.stringify(err.error ?? 'Submission failed'))
        return
      }

      router.push('/')
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-xl">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-brand-600" />
            <span className="font-bold text-gray-900">Orbya for Providers</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Set up your business</h1>
          <p className="text-gray-500 text-sm mt-1">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

          {/* Progress bar */}
          <div className="mt-4 flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-brand-600' : 'bg-gray-100'}`} />
            ))}
          </div>
        </div>

        <div className="px-8 py-6">
          {/* ── Step 0: Service types ── */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">What types of services will you offer on Orbya?</p>
              {SERVICE_TYPES.map(({ value, label, icon: Icon }) => {
                const selected = serviceTypes.includes(value)
                return (
                  <button key={value} type="button" onClick={() => toggleService(value)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                      selected ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}>
                    <div className={`p-2 rounded-lg ${selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`font-medium text-sm ${selected ? 'text-brand-700' : 'text-gray-700'}`}>{label}</span>
                    {selected && <CheckCircle className="w-5 h-5 text-brand-600 ml-auto" />}
                  </button>
                )
              })}
              {step1.formState.errors.service_types && (
                <p className="text-red-500 text-sm">{step1.formState.errors.service_types.message}</p>
              )}
            </div>
          )}

          {/* ── Step 1: Business info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Business name <span className="text-red-500">*</span></label>
                <input {...step2.register('business_name')} placeholder="Sunshine Hotels & Resorts"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
                {step2.formState.errors.business_name && <p className="text-red-500 text-xs mt-1">{step2.formState.errors.business_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact email <span className="text-red-500">*</span></label>
                <input {...step2.register('contact_email')} type="email" placeholder="contact@yourbusiness.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
                {step2.formState.errors.contact_email && <p className="text-red-500 text-xs mt-1">{step2.formState.errors.contact_email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input {...step2.register('contact_phone')} placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                  <input {...step2.register('website')} placeholder="https://"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
                  {step2.formState.errors.website && <p className="text-red-500 text-xs mt-1">{step2.formState.errors.website.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">About your business</label>
                <textarea {...step2.register('description')} rows={3}
                  placeholder="Tell customers what makes your services special..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 resize-none" />
              </div>
            </div>
          )}

          {/* ── Step 2: Business type ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-2">Is your business formally registered?</p>
              {BIZ_TYPES.map(({ value, label, desc }) => {
                const selected = bizType === value
                return (
                  <label key={value}
                    className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selected ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'
                    }`}>
                    <input type="radio" value={value} {...step3.register('business_type')} className="mt-0.5 accent-brand-600" />
                    <div>
                      <div className={`font-medium text-sm ${selected ? 'text-brand-700' : 'text-gray-700'}`}>{label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                    </div>
                  </label>
                )
              })}

              {(bizType === 'VAT_REGISTERED' || bizType === 'PAN_REGISTERED') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {bizType === 'VAT_REGISTERED' ? 'VAT number' : 'PAN number'} <span className="text-red-500">*</span>
                  </label>
                  <input {...step3.register('registration_number')}
                    placeholder={bizType === 'VAT_REGISTERED' ? 'GB123456789' : 'ABCDE1234F'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 font-mono" />
                  {step3.formState.errors.registration_number && (
                    <p className="text-red-500 text-xs mt-1">{step3.formState.errors.registration_number.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Location ── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-2">Where is your business located? This helps customers find you on the map.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
                <input {...step4.register('city')} placeholder="Mumbai"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
                {step4.formState.errors.city && <p className="text-red-500 text-xs mt-1">{step4.formState.errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Area / District</label>
                <input {...step4.register('area')} placeholder="Bandra West"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal / ZIP code</label>
                <input {...step4.register('zip_code')} placeholder="400050"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500" />
              </div>
            </div>
          )}

          {/* ── Step 4: Photos ── */}
          {step === 4 && (
            <div className="space-y-4">
              <PhotoUploader photos={photos} onChange={setPhotos} />
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{submitError}</div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-8 pb-8 flex gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          {step < 4 ? (
            <button type="button" onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting || photos.length < 2}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit for review
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
