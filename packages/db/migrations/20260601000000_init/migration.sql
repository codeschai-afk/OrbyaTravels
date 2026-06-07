-- Orbya Travel Platform — Initial Schema
-- Creates all tables. The tags column and PinImportance enum are added by
-- subsequent migrations (20260606_add_place_tags, 20260607_add_pin_importance).

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'PROVIDER', 'EMPLOYEE', 'ADMIN');
CREATE TYPE "BusinessType" AS ENUM ('PERSONAL', 'VAT_REGISTERED', 'PAN_REGISTERED');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ListingType" AS ENUM ('ACCOMMODATION', 'FLIGHT', 'BUS', 'TRAIN', 'CAR_RENTAL');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "AdvisoryLevel" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
CREATE TYPE "SeatClass" AS ENUM ('ECONOMY', 'BUSINESS', 'FIRST');
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC');
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID');
CREATE TYPE "PlaceCategory" AS ENUM ('BEACH', 'TEMPLE', 'MUSEUM', 'MARKET', 'PARK', 'MOUNTAIN', 'CITY', 'VILLAGE', 'RESTAURANT', 'NIGHTLIFE', 'ADVENTURE', 'HISTORICAL', 'OTHER');
CREATE TYPE "TravelStyle" AS ENUM ('BUDGET', 'COMFORT', 'LUXURY');
CREATE TYPE "LegType" AS ENUM ('PLACE', 'TRANSPORT', 'ACCOMMODATION');

-- ─── Auth ────────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "avatar_url" TEXT,
    "phone" TEXT,
    "email_verified" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- ─── Profiles ────────────────────────────────────────────────────────────────

CREATE TABLE "customer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "nationality" TEXT,
    "passport_number" TEXT,
    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_profiles_user_id_key" ON "customer_profiles"("user_id");
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provider_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "description" TEXT,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "stripe_account_id" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "service_types" TEXT[] NOT NULL DEFAULT '{}',
    "business_type" "BusinessType" NOT NULL DEFAULT 'PERSONAL',
    "registration_number" TEXT,
    "city" TEXT,
    "area" TEXT,
    "zip_code" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verification_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "provider_profiles_user_id_key" ON "provider_profiles"("user_id");
CREATE UNIQUE INDEX "provider_profiles_stripe_account_id_key" ON "provider_profiles"("stripe_account_id");
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provider_images" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cloudinary_id" TEXT,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "provider_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_images_provider_id_idx" ON "provider_images"("provider_id");
ALTER TABLE "provider_images" ADD CONSTRAINT "provider_images_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Countries ───────────────────────────────────────────────────────────────

CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso_code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "travel_advisory" "AdvisoryLevel" NOT NULL DEFAULT 'NONE',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "countries_iso_code_key" ON "countries"("iso_code");
CREATE UNIQUE INDEX "countries_slug_key" ON "countries"("slug");

CREATE TABLE "country_images" (
    "id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "country_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "country_images_country_id_idx" ON "country_images"("country_id");
ALTER TABLE "country_images" ADD CONSTRAINT "country_images_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Listings ────────────────────────────────────────────────────────────────

CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "type" "ListingType" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "flagged_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "listings_slug_type_key" ON "listings"("slug", "type");
CREATE INDEX "listings_country_id_idx" ON "listings"("country_id");
CREATE INDEX "listings_type_idx" ON "listings"("type");
CREATE INDEX "listings_approval_status_idx" ON "listings"("approval_status");
CREATE INDEX "listings_provider_id_idx" ON "listings"("provider_id");
ALTER TABLE "listings" ADD CONSTRAINT "listings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON UPDATE CASCADE;
ALTER TABLE "listings" ADD CONSTRAINT "listings_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON UPDATE CASCADE;

CREATE TABLE "listing_images" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "listing_images_listing_id_idx" ON "listing_images"("listing_id");
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Accommodation ───────────────────────────────────────────────────────────

CREATE TABLE "accommodation_details" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "stars" INTEGER,
    "amenities" TEXT[] NOT NULL DEFAULT '{}',
    "check_in_time" TEXT NOT NULL DEFAULT '14:00',
    "check_out_time" TEXT NOT NULL DEFAULT '11:00',
    CONSTRAINT "accommodation_details_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accommodation_details_listing_id_key" ON "accommodation_details"("listing_id");
ALTER TABLE "accommodation_details" ADD CONSTRAINT "accommodation_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "accommodation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "price_per_night" DECIMAL(12,2) NOT NULL,
    "total_rooms" INTEGER NOT NULL,
    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "room_types_accommodation_id_idx" ON "room_types"("accommodation_id");
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_accommodation_id_fkey" FOREIGN KEY ("accommodation_id") REFERENCES "accommodation_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "room_availabilities" (
    "id" TEXT NOT NULL,
    "room_type_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "rooms_left" INTEGER NOT NULL,
    CONSTRAINT "room_availabilities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "room_availabilities_room_type_id_date_key" ON "room_availabilities"("room_type_id", "date");
CREATE INDEX "room_availabilities_room_type_id_date_idx" ON "room_availabilities"("room_type_id", "date");
ALTER TABLE "room_availabilities" ADD CONSTRAINT "room_availabilities_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Flights ─────────────────────────────────────────────────────────────────

CREATE TABLE "flight_details" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "flight_number" TEXT NOT NULL,
    "origin_city" TEXT NOT NULL,
    "origin_iata" TEXT NOT NULL,
    "destination_city" TEXT NOT NULL,
    "destination_iata" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    CONSTRAINT "flight_details_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "flight_details_listing_id_key" ON "flight_details"("listing_id");
ALTER TABLE "flight_details" ADD CONSTRAINT "flight_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "flight_schedules" (
    "id" TEXT NOT NULL,
    "flight_id" TEXT NOT NULL,
    "departure_at" TIMESTAMP(3) NOT NULL,
    "arrival_at" TIMESTAMP(3) NOT NULL,
    "seats_economy" INTEGER NOT NULL,
    "seats_business" INTEGER NOT NULL,
    "seats_first" INTEGER NOT NULL,
    "price_economy" DECIMAL(12,2) NOT NULL,
    "price_business" DECIMAL(12,2) NOT NULL,
    "price_first" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "flight_schedules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "flight_schedules_flight_id_departure_at_idx" ON "flight_schedules"("flight_id", "departure_at");
ALTER TABLE "flight_schedules" ADD CONSTRAINT "flight_schedules_flight_id_fkey" FOREIGN KEY ("flight_id") REFERENCES "flight_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Bus ─────────────────────────────────────────────────────────────────────

CREATE TABLE "bus_details" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "origin_city" TEXT NOT NULL,
    "destination_city" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "bus_type" TEXT NOT NULL,
    "amenities" TEXT[] NOT NULL DEFAULT '{}',
    CONSTRAINT "bus_details_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bus_details_listing_id_key" ON "bus_details"("listing_id");
ALTER TABLE "bus_details" ADD CONSTRAINT "bus_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Train ───────────────────────────────────────────────────────────────────

CREATE TABLE "train_details" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "train_number" TEXT NOT NULL,
    "origin_city" TEXT NOT NULL,
    "origin_station" TEXT NOT NULL,
    "destination_city" TEXT NOT NULL,
    "destination_station" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    CONSTRAINT "train_details_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "train_details_listing_id_key" ON "train_details"("listing_id");
ALTER TABLE "train_details" ADD CONSTRAINT "train_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Transport Schedule (bus + train shared) ──────────────────────────────────

CREATE TABLE "transport_schedules" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "departure_at" TIMESTAMP(3) NOT NULL,
    "arrival_at" TIMESTAMP(3) NOT NULL,
    "total_seats" INTEGER NOT NULL,
    "price_per_seat" DECIMAL(12,2) NOT NULL,
    "seat_class" "SeatClass" NOT NULL DEFAULT 'ECONOMY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "transport_schedules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "transport_schedules_listing_id_departure_at_idx" ON "transport_schedules"("listing_id", "departure_at");
ALTER TABLE "transport_schedules" ADD CONSTRAINT "transport_schedules_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Car Rental ──────────────────────────────────────────────────────────────

CREATE TABLE "car_rental_details" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "transmission" "TransmissionType" NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "seats" INTEGER NOT NULL,
    "price_per_day" DECIMAL(12,2) NOT NULL,
    "pickup_location" TEXT NOT NULL,
    "dropoff_location" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "features" TEXT[] NOT NULL DEFAULT '{}',
    "total_vehicles" INTEGER NOT NULL,
    CONSTRAINT "car_rental_details_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "car_rental_details_listing_id_key" ON "car_rental_details"("listing_id");
ALTER TABLE "car_rental_details" ADD CONSTRAINT "car_rental_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "vehicle_availabilities" (
    "id" TEXT NOT NULL,
    "car_rental_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "vehicles_left" INTEGER NOT NULL,
    CONSTRAINT "vehicle_availabilities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vehicle_availabilities_car_rental_id_date_key" ON "vehicle_availabilities"("car_rental_id", "date");
CREATE INDEX "vehicle_availabilities_car_rental_id_date_idx" ON "vehicle_availabilities"("car_rental_id", "date");
ALTER TABLE "vehicle_availabilities" ADD CONSTRAINT "vehicle_availabilities_car_rental_id_fkey" FOREIGN KEY ("car_rental_id") REFERENCES "car_rental_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Bookings ────────────────────────────────────────────────────────────────

CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripe_payment_intent_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bookings_stripe_payment_intent_id_key" ON "bookings"("stripe_payment_intent_id");
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON UPDATE CASCADE;

CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "item_type" "ListingType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "check_in_date" DATE,
    "check_out_date" DATE,
    "room_type_id" TEXT,
    "flight_schedule_id" TEXT,
    "transport_schedule_id" TEXT,
    "seat_class" "SeatClass",
    "passenger_count" INTEGER,
    "pickup_date" DATE,
    "return_date" DATE,
    "metadata" JSONB,
    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_items_booking_id_idx" ON "booking_items"("booking_id");
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON UPDATE CASCADE;
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON UPDATE CASCADE;
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_flight_schedule_id_fkey" FOREIGN KEY ("flight_schedule_id") REFERENCES "flight_schedules"("id") ON UPDATE CASCADE;
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_transport_schedule_id_fkey" FOREIGN KEY ("transport_schedule_id") REFERENCES "transport_schedules"("id") ON UPDATE CASCADE;

CREATE TABLE "booking_status_events" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "from_status" "BookingStatus",
    "to_status" "BookingStatus" NOT NULL,
    "note" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_status_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_status_events_booking_id_idx" ON "booking_status_events"("booking_id");
ALTER TABLE "booking_status_events" ADD CONSTRAINT "booking_status_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Payments ────────────────────────────────────────────────────────────────

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider_amount" DECIMAL(12,2) NOT NULL,
    "platform_fee" DECIMAL(12,2) NOT NULL,
    "stripe_transfer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payments_booking_id_key" ON "payments"("booking_id");
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON UPDATE CASCADE;

CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "stripe_refund_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "refunds_stripe_refund_id_key" ON "refunds"("stripe_refund_id");
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON UPDATE CASCADE;

-- ─── Reviews ─────────────────────────────────────────────────────────────────

CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "reviews_user_id_booking_id_listing_id_key" ON "reviews"("user_id", "booking_id", "listing_id");
CREATE INDEX "reviews_listing_id_idx" ON "reviews"("listing_id");
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON UPDATE CASCADE;

-- ─── Notifications ───────────────────────────────────────────────────────────

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Places ──────────────────────────────────────────────────────────────────
-- NOTE: tags column added by 20260606000000_add_place_tags
-- NOTE: pin_importance column added by 20260607000000_add_pin_importance

CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "curated_by" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" "PlaceCategory" NOT NULL DEFAULT 'OTHER',
    "city" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "places_slug_country_id_key" ON "places"("slug", "country_id");
CREATE INDEX "places_country_id_idx" ON "places"("country_id");
CREATE INDEX "places_category_idx" ON "places"("category");
ALTER TABLE "places" ADD CONSTRAINT "places_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON UPDATE CASCADE;
ALTER TABLE "places" ADD CONSTRAINT "places_curated_by_fkey" FOREIGN KEY ("curated_by") REFERENCES "users"("id") ON UPDATE CASCADE;

CREATE TABLE "place_images" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "place_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "place_images_place_id_idx" ON "place_images"("place_id");
ALTER TABLE "place_images" ADD CONSTRAINT "place_images_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Bucket List ─────────────────────────────────────────────────────────────

CREATE TABLE "bucket_list_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "visited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bucket_list_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bucket_list_items_user_id_place_id_key" ON "bucket_list_items"("user_id", "place_id");
CREATE INDEX "bucket_list_items_user_id_idx" ON "bucket_list_items"("user_id");
ALTER TABLE "bucket_list_items" ADD CONSTRAINT "bucket_list_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bucket_list_items" ADD CONSTRAINT "bucket_list_items_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Trip Plans ──────────────────────────────────────────────────────────────

CREATE TABLE "trip_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "travel_style" "TravelStyle" NOT NULL DEFAULT 'COMFORT',
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "trip_plans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "trip_plans_user_id_idx" ON "trip_plans"("user_id");
ALTER TABLE "trip_plans" ADD CONSTRAINT "trip_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_plans" ADD CONSTRAINT "trip_plans_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON UPDATE CASCADE;

CREATE TABLE "trip_plan_days" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    CONSTRAINT "trip_plan_days_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "trip_plan_days_plan_id_idx" ON "trip_plan_days"("plan_id");
ALTER TABLE "trip_plan_days" ADD CONSTRAINT "trip_plan_days_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "trip_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trip_plan_legs" (
    "id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "LegType" NOT NULL,
    "place_id" TEXT,
    "listing_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER,
    "tip" TEXT,
    CONSTRAINT "trip_plan_legs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "trip_plan_legs_day_id_idx" ON "trip_plan_legs"("day_id");
ALTER TABLE "trip_plan_legs" ADD CONSTRAINT "trip_plan_legs_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "trip_plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_plan_legs" ADD CONSTRAINT "trip_plan_legs_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON UPDATE CASCADE;
ALTER TABLE "trip_plan_legs" ADD CONSTRAINT "trip_plan_legs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON UPDATE CASCADE;
