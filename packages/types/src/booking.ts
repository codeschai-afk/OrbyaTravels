import type { BookingStatus, PaymentStatus, SeatClass } from './enums'

export interface Booking {
  id: string
  customer_id: string
  country_id: string
  status: BookingStatus
  total_amount: number
  currency: string
  stripe_payment_intent_id: string | null
  notes: string | null
  created_at: Date
  updated_at: Date
  items: BookingItem[]
}

export interface BookingItem {
  id: string
  booking_id: string
  listing_id: string
  item_type: 'ACCOMMODATION' | 'FLIGHT' | 'BUS' | 'TRAIN' | 'CAR_RENTAL'
  quantity: number
  unit_price: number
  total_price: number
  currency: string
  // Type-specific snapshot fields — captured at booking time to survive listing edits
  check_in_date: Date | null
  check_out_date: Date | null
  room_type_id: string | null
  schedule_id: string | null
  seat_class: SeatClass | null
  pickup_date: Date | null
  return_date: Date | null
  passenger_count: number | null
  metadata: Record<string, unknown> | null
}

export interface BookingStatusEvent {
  id: string
  booking_id: string
  from_status: BookingStatus | null
  to_status: BookingStatus
  note: string | null
  created_by: string | null
  created_at: Date
}

export interface Payment {
  id: string
  booking_id: string
  stripe_payment_intent_id: string
  amount: number
  currency: string
  status: PaymentStatus
  provider_amount: number
  platform_fee: number
  created_at: Date
  updated_at: Date
}

export interface Review {
  id: string
  user_id: string
  listing_id: string
  booking_id: string
  rating: number
  comment: string | null
  created_at: Date
  updated_at: Date
}
