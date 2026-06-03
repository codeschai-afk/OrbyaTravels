'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import { Globe, Loader2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function AdminSignInPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    const res = await signIn('credentials', { ...data, redirect: false })
    if (res?.error) {
      setError('root', { message: 'Invalid credentials or insufficient permissions' })
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 text-white font-bold text-2xl mb-8">
          <Globe className="w-7 h-7 text-brand-400" />
          Orbya Admin
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <h1 className="text-xl font-bold text-white mb-6">Admin sign in</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="bg-red-900/40 border border-red-700 text-red-400 text-sm rounded-xl px-4 py-3">
                {errors.root.message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <input {...register('email')} type="email" placeholder="admin@orbyatravel.com"
                className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-900 placeholder:text-gray-500" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <input {...register('password')} type="password" placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-900" />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
