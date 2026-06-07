-- Add missing enum types (not in 20260603192100_init)
CREATE TYPE "BusinessType" AS ENUM ('PERSONAL', 'VAT_REGISTERED', 'PAN_REGISTERED');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "PlaceCategory" AS ENUM ('BEACH', 'TEMPLE', 'MUSEUM', 'MARKET', 'PARK', 'MOUNTAIN', 'CITY', 'VILLAGE', 'RESTAURANT', 'NIGHTLIFE', 'ADVENTURE', 'HISTORICAL', 'OTHER');
CREATE TYPE "TravelStyle" AS ENUM ('BUDGET', 'COMFORT', 'LUXURY');
CREATE TYPE "LegType" AS ENUM ('PLACE', 'TRANSPORT', 'ACCOMMODATION');

-- Add missing columns to provider_profiles
ALTER TABLE "provider_profiles"
  ADD COLUMN "service_types" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "business_type" "BusinessType" NOT NULL DEFAULT 'PERSONAL',
  ADD COLUMN "registration_number" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "area" TEXT,
  ADD COLUMN "zip_code" TEXT,
  ADD COLUMN "latitude" DECIMAL(10,7),
  ADD COLUMN "longitude" DECIMAL(10,7),
  ADD COLUMN "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "verification_note" TEXT;

-- Add provider_images table
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

-- Add places table (tags added by 20260606000000_add_place_tags, pin_importance by 20260607000000_add_pin_importance)
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

-- Add place_images table
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

-- Add bucket_list_items table
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

-- Add trip_plans table
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

-- Add trip_plan_days table
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

-- Add trip_plan_legs table
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
