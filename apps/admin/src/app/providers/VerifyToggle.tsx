'use client'

import { useState, useTransition } from 'react'

export function VerifyToggle({ id, verified }: { id: string; verified: boolean }) {
  const [checked, setChecked] = useState(verified)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    const next = !checked
    setChecked(next)
    startTransition(async () => {
      await fetch(`/api/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: next }),
      })
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
        checked ? 'bg-brand-600' : 'bg-gray-200'
      } ${pending ? 'opacity-50' : ''}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}
