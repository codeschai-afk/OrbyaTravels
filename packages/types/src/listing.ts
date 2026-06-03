import type { ListingType, ApprovalStatus, SeatClass, TransmissionType, FuelType } from './enums'

export interface Country {
  id: string
  name: string
  iso_code: string
  slug: string
  description: string | null
  travel_advisory: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  is_active: boolean
  is_featured: boolean
  hero_images: CountryImage[]
  created_at: Date
  updated_at: Date
}

export interface CountryImage {
  id: string
  country_id: string
  url: string
  alt_text: string | null
  sort_order: number
}

export interface Listing {
  id: string
  provider_id: string
  country_id: string
  type: ListingType
  title: string
  description: string
  base_price: number
  currency: string
  approval_status: ApprovalStatus
  rejection_reason: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
  images: ListingImage[]
}

export interface ListingImage {
  id: string
  listing_id: string
  url: string
  alt_text: string | null
  sort_order: number
}

export interface AccommodationDetail {
  id: string
  listing_id: string
  address: string
  city: string
  latitude: number | null
  longitude: number | null
  stars: number | null
  amenities: string[]
  check_in_time: string
  check_out_time: string
  room_types: RoomType[]
}

export interface RoomType {
  id: string
  accommodation_id: string
  name: string
  description: string | null
  capacity: number
  price_per_night: number
  total_rooms: number
}

export interface FlightDetail {
  id: string
  listing_id: string
  airline: string
  flight_number: string
  origin_city: string
  origin_iata: string
  destination_city: string
  destination_iata: string
  duration_minutes: number
  schedules: FlightSchedule[]
}

export interface FlightSchedule {
  id: string
  flight_id: string
  departure_at: Date
  arrival_at: Date
  seats_economy: number
  seats_business: number
  seats_first: number
  price_economy: number
  price_business: number
  price_first: number
  is_active: boolean
}

export interface BusDetail {
  id: string
  listing_id: string
  operator: string
  origin_city: string
  destination_city: string
  duration_minutes: number
  bus_type: string
  amenities: string[]
  schedules: TransportSchedule[]
}

export interface TrainDetail {
  id: string
  listing_id: string
  operator: string
  train_number: string
  origin_city: string
  origin_station: string
  destination_city: string
  destination_station: string
  duration_minutes: number
  schedules: TransportSchedule[]
}

export interface TransportSchedule {
  id: string
  listing_id: string
  departure_at: Date
  arrival_at: Date
  total_seats: number
  price_per_seat: number
  seat_class: SeatClass
  is_active: boolean
}

export interface CarRentalDetail {
  id: string
  listing_id: string
  make: string
  model: string
  year: number
  transmission: TransmissionType
  fuel_type: FuelType
  seats: number
  price_per_day: number
  pickup_location: string
  dropoff_location: string | null
  latitude: number | null
  longitude: number | null
  features: string[]
  total_vehicles: number
}
