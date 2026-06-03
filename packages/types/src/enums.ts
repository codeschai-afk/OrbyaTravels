export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'EMPLOYEE' | 'ADMIN'

export type ListingType = 'ACCOMMODATION' | 'FLIGHT' | 'BUS' | 'TRAIN' | 'CAR_RENTAL'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED'

export type BookingStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'

export type AdvisoryLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'

export type SeatClass = 'ECONOMY' | 'BUSINESS' | 'FIRST'

export type TransmissionType = 'MANUAL' | 'AUTOMATIC'

export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID'
