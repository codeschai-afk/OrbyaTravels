# CLAUDE.md — Orbya Travel Platform

> Claude Code context file. Read this before touching any file in this repo.
> Last updated: 2026-06-07

---

## What This Project Is

A full-stack travel agency platform. Four distinct portals, one monorepo.

Customers discover destinations on a satellite map, save places, get AI-generated itineraries, and book from verified local providers. Service providers list hotels, transport, and rentals. Employees curate places and moderate listings. Admins control everything.

```
orbyatravel.com              Customer portal
provider.orbyatravel.com     Service provider portal
staff.orbyatravel.com        Employee portal  [Cloudflare Zero Trust]
admin.orbyatravel.com        Admin portal     [Cloudflare Zero Trust]
storage.orbyatravel.com      MinIO object storage (images)
```

---

## Monorepo Layout

```
orbyatravel/
├── apps/
│   ├── web/          Next.js 14 — Customer portal
│   ├── provider/     Next.js 14 — Service provider portal
│   ├── employee/     Next.js 14 — Employee portal
│   ├── admin/        Next.js 14 — Admin portal
│   └── api/          (Hono backend — scaffolded, mostly unused; portals query DB directly)
│
├── packages/
│   ├── ui/           Shared component library (shadcn/ui base)
│   ├── db/           Prisma schema + generated client
│   └── config/       Shared ESLint, Tailwind, TypeScript configs
│
├── docker/
│   ├── Caddyfile                  Reverse proxy + automatic HTTPS
│   ├── docker-compose.yml         Local dev
│   └── docker-compose.prod.yml    Production (DigitalOcean Droplet)
│
└── .github/
    └── workflows/    CI/CD — GitHub Actions → GHCR → Droplet SSH deploy
```

**Build tool:** Turborepo (`pnpm dev` from root starts all apps).

---

## Tech Stack

### Frontend (all portals)
- Next.js 14, App Router, TypeScript, `output: 'standalone'` (required for Docker)
- Tailwind CSS
- React Hook Form + Zod (forms + validation)
- **MapLibre GL** — open-source map rendering (replaced Mapbox/Leaflet)
- **ESRI World Imagery** — free satellite tiles, no API key required
  - Tile URL: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
  - Label overlay: `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`

### Database
- **PostgreSQL 16** — self-hosted in Docker
- **Prisma ORM** — schema at `packages/db/schema.prisma`, client at `packages/db/generated/client`
- Never run `prisma migrate dev` (requires TTY). Instead: write SQL manually in `packages/db/migrations/<timestamp>_<name>/migration.sql` then run `prisma migrate deploy`

### Storage
- **MinIO** — self-hosted S3-compatible object storage (replaced Cloudinary)
- Bucket: `orbya-images`, public read
- Public URL: `https://storage.orbyatravel.com` (production), `http://localhost:9000` (dev)
- Upload via `@aws-sdk/client-s3` with `forcePathStyle: true`
- Images processed with **sharp** before upload: resize to 1400px max width, convert to WebP quality 82
- Storage helper at `apps/employee/src/lib/storage.ts` and `apps/provider/src/lib/storage.ts`
- MinIO console at port 9001 (local) or `storage-admin.orbyatravel.com` (prod)

### AI / Trip Planner
- **Groq** (`groq-sdk`) with model `llama-3.3-70b-versatile`
- Route: `apps/web/src/app/api/trip-plan/route.ts`
- **RAG pattern**: fetches all approved provider listings for the country and injects as knowledge base into the prompt. AI is instructed to use EXACT listing titles for ACCOMMODATION and TRANSPORT legs. After generation, titles are matched back to real listing IDs in post-processing.
- Customers select duration + travel style → AI generates day-by-day plan → customer can swap legs with real provider listings via the ItineraryEditor

### Auth
- **NextAuth v5 (Auth.js)** — email/password, JWT sessions
- RBAC: `CUSTOMER | PROVIDER | EMPLOYEE | ADMIN`
- Each portal has its own `apps/<app>/src/lib/auth.ts` and `apps/<app>/src/app/api/auth/[...nextauth]/route.ts`

### Payments
- Stripe (customer payments + provider Connect payouts) — wired but not fully tested

### Notifications
- Brevo (SMTP + transactional email)

---

## Database Schema — Key Models

### Place
Employee-curated attractions pinned on the map.
```prisma
model Place {
  id             String        @id @default(cuid())
  country_id     String
  curated_by     String        -- User ID of the employee who added it
  name           String
  slug           String
  description    String?
  category       PlaceCategory @default(OTHER)
  tags           String[]      -- descriptive labels (Family-friendly, UNESCO, Hiking, etc.)
  pin_importance PinImportance @default(MAJOR)  -- controls map zoom visibility
  city           String?
  address        String?
  latitude       Decimal       @db.Decimal(10, 7)
  longitude      Decimal       @db.Decimal(10, 7)
  is_active      Boolean       @default(true)
  images         PlaceImage[]
  ...
}

enum PinImportance { MAJOR MEDIUM MINOR }
-- MAJOR: always visible on map
-- MEDIUM: visible at zoom >= 8 (city level)
-- MINOR: visible at zoom >= 10.5 (street level)
```

### ProviderProfile
Providers have city, zip_code, latitude, longitude for geo-correlation with places.

### Country
Countries have `hero_images` (ESRI satellite thumbnails uploaded via the admin), `places`, `listings`.

---

## Map System (`/plan/[slug]`)

The customer-facing country page is a full-screen satellite map experience.

**Key files:**
- `apps/web/src/app/plan/[slug]/page.tsx` — server component, fetches places + providers
- `apps/web/src/app/plan/[slug]/PlanClient.tsx` — client wrapper with bucket list + plan builder state
- `apps/web/src/app/plan/[slug]/CountryMap.tsx` — MapLibre GL map component

**How it works:**
1. `page.tsx` fetches active places (all images + pin_importance), approved providers with listings in the country
2. `CountryMap` renders ESRI satellite tiles, plots pins as DOM markers
3. Pins use `pin_importance` + current zoom to toggle `display: none` — no re-render needed
4. Country bounds from `apps/web/public/maps/bounds.json` restrict max pan/zoom
5. Clicking a pin slides in a detail card (photo gallery, description, nearby providers by city)
6. "Plan my trip" button opens the AI plan builder panel

**Plan builder panel (`PlanClient.tsx`):**
- `bucket: Set<string>` — IDs in bucket list
- `orderedBucket: string[]` — same IDs but user-ordered. Kept in sync with bucket on toggle.
- `dayHints: Record<string, number | null>` — per-place preferred day number
- User can reorder places with ↑↓ arrows and assign preferred days in the panel
- `handleGenerate` sends `bucket_list: orderedBucket` + `day_hints` (nulls stripped) to the API

**GeoJSON data:** Country outlines in `apps/web/public/geodata/` (from `johan/world.geo.json`).
**Bounds data:** `apps/web/public/maps/bounds.json` — bounding boxes for all 10 countries.
**Map script:** `apps/web/scripts/generate-maps.js` regenerates bounds.json from geodata.

**Important:** ESRI tiles are loaded directly by the browser from ESRI CDN — no proxy needed, no API key.

---

## Employee Portal — Places Management

Employees add/edit attractions. The PlaceForm (`apps/employee/src/app/places/PlaceForm.tsx`) supports:
- **Category** (sets pin icon on map): BEACH, TEMPLE, MUSEUM, MARKET, PARK, MOUNTAIN, CITY, VILLAGE, RESTAURANT, NIGHTLIFE, ADVENTURE, HISTORICAL, OTHER
- **Pin importance**: MAJOR / MEDIUM / MINOR (radio cards in the form)
- **Tags**: preset chips (Family-friendly, Budget, UNESCO, etc.) + custom tag input
- **Coordinate parsing**: accepts decimal `27.7172, 85.3240`, DMS `27°43'1.92"N`, Google Maps URL `@lat,lng,zoom`
- **Photos**: multi-upload → `/api/upload` → MinIO (sharp resize → WebP)
- Mini OSM iframe preview shown when valid coordinates are entered

---

## Provider Portal

**Onboarding wizard** at `/profile/setup` (multi-step):
1. Service types selection
2. Business info (name, description, email, phone, website)
3. Business type (PERSONAL / VAT_REGISTERED / PAN_REGISTERED) + registration number
4. Location (city, area, zip code, coordinates)
5. Photo upload (2–7 photos → MinIO)

**Status flow:** PENDING → employee reviews at `/providers` → APPROVED or REJECTED with note

**Listings:** Full CRUD for Hotels, Car Rentals, Buses, Flights, Trains.
- All go through `/api/listings` which creates both the Listing record and the type-specific detail record in a transaction.
- New listings default to `approval_status: PENDING` (employee must approve).
- **CarForm bug fix:** `base_price` is set server-side from `price_per_day` — do not add a separate base_price input to the car rental form.

---

## Admin Portal

**Providers page** (`/providers`): list of all providers with status badge. Clicking a provider name goes to `/providers/[id]` — full detail page showing photos (with lightbox), listings, contact info, approve/reject buttons.

**Other pages:** Users (role management), Listings (approval queue), Countries (destination management), Revenue.

---

## AI Trip Planner — RAG Architecture

`apps/web/src/app/api/trip-plan/route.ts`

**Input:** `{ country_id, bucket_list: string[], day_hints?: Record<string, number>, duration_days, travel_style }`
- `bucket_list`: **ordered** array of place IDs (user-sorted in the plan panel — first = highest priority)
- `day_hints`: optional map of `place_id → preferred day number` (1-indexed)

**Style-specific provider filtering (CRITICAL):**
- LUXURY: only inject CAR_RENTAL listings as transport. Prompt mandates car rental for EVERY transport leg.
- BUDGET: only inject BUS/TRAIN listings as transport. Prompt explicitly says "NEVER suggest car rentals".
- COMFORT: inject all transport types.
- Accommodation injected for all styles.

**Context injected into Groq prompt:**
1. User's ordered bucket list places (with day hints if set)
2. All active places for the country
3. Style-filtered provider listings (stays + style-appropriate transport)

**Post-processing:** After AI responds, ACCOMMODATION and TRANSPORT legs are matched by title (case-insensitive) against the real listing catalog. Matched legs get `listing_id` set so the ItineraryEditor can show the "Provider booked" badge and price.

**Itinerary Editor** (`apps/web/src/app/plan/[slug]/itinerary/[planId]/ItineraryEditor.tsx`):
- Two-column layout (`xl:grid-cols-[1fr_296px]`): left = day timeline, right = provider sidebar
- Provider sidebar (`ProviderSidebar`) shows style-filtered listings: LUXURY shows cars first, BUDGET shows buses/trains first
- LUXURY transport legs show "Book car rental" button (purple) instead of generic "Book provider"
- LUXURY transport legs without a booking show a prompt nudge in view mode
- Swap modal: LUXURY sorts CAR_RENTAL listings first; BUDGET sorts BUS/TRAIN first
- Save changes via `PATCH /api/trip-plan/[id]`

---

## Container Layout (Docker)

```
caddy           443/80     routes by hostname
web             3000       orbyatravel.com
provider        3001       provider.orbyatravel.com
employee        3002       staff.orbyatravel.com
admin           3003       admin.orbyatravel.com
postgres        5432       internal
redis           6379       internal
minio           9000       internal (storage.orbyatravel.com via Caddy)
minio console   9001       internal (storage-admin.orbyatravel.com via Caddy)
```

---

## Environment Variables

**Root `.env.local`** (shared — symlink or copy into each app's directory):

```bash
# Database
DATABASE_URL="postgresql://orbya:password@localhost:5432/orbya"

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"   # per-app for each portal

# MinIO (self-hosted S3)
MINIO_ENDPOINT="http://localhost:9000"          # or http://minio:9000 in docker
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_PUBLIC_URL="http://localhost:9000"        # https://storage.orbyatravel.com in prod
NEXT_PUBLIC_MINIO_PUBLIC_URL="http://localhost:9000"
MINIO_ROOT_USER="minioadmin"                    # for docker-compose MinIO service
MINIO_ROOT_PASSWORD="minioadmin"

# AI
GROQ_API_KEY="..."

# Payments (optional in dev)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PUBLISHABLE_KEY=""

# Email
BREVO_API_KEY="..."
BREVO_SMTP_KEY="..."
```

**Production-only (on Droplet at `/opt/orbya/.env.prod`):**
- Same vars but with real credentials
- `MINIO_ENDPOINT=http://minio:9000` (internal docker network)
- `MINIO_PUBLIC_URL=https://storage.orbyatravel.com`
- `NEXTAUTH_URL` set per-app to the real domain

---

## Deployment

```
git push origin main
        ↓
GitHub Actions builds 4 Docker images → pushes to GHCR
        ↓
SSH into Droplet → docker compose pull + up -d
```

**Required GitHub Secrets:** `DO_HOST`, `DO_USER`, `DO_SSH_KEY`

**Build fixes in place:**
- All `next.config.mjs` files have `eslint: { ignoreDuringBuilds: true }` (ESLint v9 incompatibility)
- Groq client instantiated inside POST handler body (not module level — avoids build-time crash when `GROQ_API_KEY` is undefined)
- `sharp: true` in `pnpm-workspace.yaml` allows native sharp build

---

## DB Migration Workflow

1. Edit `packages/db/schema.prisma`
2. Write SQL in `packages/db/migrations/<timestamp>_<name>/migration.sql`
3. Apply locally: `DATABASE_URL="postgresql://orbya:password@localhost:5432/orbya" pnpm --filter @orbyatravel/db exec prisma migrate deploy`
4. Regenerate client: `DATABASE_URL="..." pnpm --filter @orbyatravel/db exec prisma generate`
5. **Never use `prisma migrate dev`** — it requires an interactive TTY

**Current migrations:**
- `20260606000000_add_place_tags` — adds `tags String[]` to Place
- `20260607000000_add_pin_importance` — adds `PinImportance` enum + `pin_importance` column to Place

---

## Port Map (local dev)

```
3000    apps/web        Customer portal
3001    apps/provider   Provider portal
3002    apps/employee   Employee portal
3003    apps/admin      Admin portal
5432    PostgreSQL
6379    Redis
9000    MinIO API
9001    MinIO Console
```

---

## Known Constraints & Gotchas

- **`prisma migrate dev` cannot be used** in this environment (no interactive TTY). Always use `prisma migrate deploy` with manually written SQL.
- **MinIO `forcePathStyle: true` is required** for the S3 client when using MinIO (not AWS S3).
- **ESRI tiles are fetched by the browser directly** — no server-side tile proxy, no API key. Don't add a proxy.
- **Each Next.js app needs its own `.env.local`** in the app directory. The root `.env.local` is not inherited.
- **MapLibre markers use DOM elements** — they are NOT part of the map style/layers. Markers must be added after `map.on('load')` fires (use `mapLoaded` state pattern in CountryMap).
- **Zoom-based pin visibility** is done by toggling `marker.getElement().style.display` directly — no React state update needed for performance.
- **`packages/db` PrismaClient** uses a Proxy for lazy initialization. Never remove this pattern or you'll get `DATABASE_URL not found` in dev.
- **2 GB RAM Droplet** — do not add memory-hungry services. Current containers use ~1.3–1.5 GB.
- **No RLS in Postgres** — access control is at the application layer via session role checks on every API route.
- **Provider verification** — new providers land at `verification_status: PENDING`. Employee must APPROVE at `/providers` before they can manage listings.
- **Staff/admin portals** are gated by Cloudflare Zero Trust before the container sees the request. Still enforce RBAC inside the app.
- **Seed credentials (local dev only):** `admin@orbyatravel.com` / `password123`, `employee@orbyatravel.com` / `password123`, `provider@orbyatravel.com` / `password123`, `customer@orbyatravel.com` / `password123`

---

## Current Build Status

```
Maps            ✅ MapLibre GL + ESRI satellite, zoom-based pin importance
Storage         ✅ MinIO self-hosted, sharp resize → WebP
Places          ✅ Employee CRUD with tags, pin importance, coord parsing, multi-photo
AI Trip Planner ✅ Groq + RAG, style-specific providers, place reorder/day hints, provider sidebar
Custom Plan     ✅ /plan/[slug]/custom — manual day/leg builder, picks from places + listings
Checkout        ✅ POST /api/checkout — batch-books all provider-linked legs into one Booking
Provider Portal ✅ Full onboarding, listings CRUD, notification dots (pending listings + new bookings)
Employee Portal ✅ Places, provider review, listing approval, notification dots, provider detail + orders
Admin Portal    ✅ Provider detail/approve, user management, countries
Payments        🔄 Stripe wired, not fully tested
Email notifs    ⬜ Brevo configured, sending not implemented
Deployment      🔄 GitHub Actions + DO Droplet — MinIO needs prod env vars set
```

*Update this file in the same PR whenever architecture, env vars, or major features change.*
