'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  name: string | null
  email: string | null
  role: string
  email_verified: Date | null
  created_at: Date
  _count: { bookings: number }
}

const ROLES = ['CUSTOMER', 'PROVIDER', 'EMPLOYEE', 'ADMIN'] as const

const ROLE_STYLE: Record<string, string> = {
  ADMIN:    'bg-purple-100 text-purple-700',
  EMPLOYEE: 'bg-blue-100 text-blue-700',
  PROVIDER: 'bg-emerald-100 text-emerald-700',
  CUSTOMER: 'bg-gray-100 text-gray-600',
}

function RoleSelect({ user }: { user: User }) {
  const router = useRouter()
  const [role, setRole] = useState(user.role)
  const [saving, setSaving] = useState(false)

  const changeRole = async (next: string) => {
    if (next === role) return
    setSaving(true)
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: next }),
    })
    setSaving(false)
    if (res.ok) { setRole(next); router.refresh() }
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <select
        value={role}
        onChange={e => changeRole(e.target.value)}
        disabled={saving}
        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer appearance-none pr-6 ${ROLE_STYLE[role]} disabled:opacity-60`}
      >
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      {saving && (
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
      )}
    </div>
  )
}

export function UsersTable({ users }: { users: User[] }) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <div>
      <div className="mb-4">
        <input
          type="search" placeholder="Search by name or email…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">User</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Bookings</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Verified</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{u.name ?? '—'}</div>
                  <div className="text-gray-400 text-xs">{u.email}</div>
                </td>
                <td className="px-4 py-4">
                  <RoleSelect user={u} />
                </td>
                <td className="px-4 py-4 text-gray-600">{u._count.bookings}</td>
                <td className="px-4 py-4">
                  {u.email_verified ? (
                    <span className="text-emerald-600 text-xs font-medium">✓ Yes</span>
                  ) : (
                    <span className="text-gray-400 text-xs">No</span>
                  )}
                </td>
                <td className="px-4 py-4 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">No users match your search</div>
        )}
      </div>
    </div>
  )
}
