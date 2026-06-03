import type { UserRole } from './enums'

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  avatar_url: string | null
  phone: string | null
  email_verified: Date | null
  created_at: Date
  updated_at: Date
}

export interface CustomerProfile {
  id: string
  user_id: string
  date_of_birth: Date | null
  nationality: string | null
  passport_number: string | null
}

export interface ProviderProfile {
  id: string
  user_id: string
  business_name: string
  description: string | null
  contact_email: string
  contact_phone: string | null
  website: string | null
  logo_url: string | null
  stripe_account_id: string | null
  is_verified: boolean
  created_at: Date
  updated_at: Date
}
