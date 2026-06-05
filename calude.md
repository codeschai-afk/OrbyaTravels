# CLAUDE.md — Orbya Travel Platform

> Claude Code context file. Read this before touching any file in this repo.
> Last updated: 2026-06-05

---

## What This Project Is

A full-stack travel agency platform. Four distinct portals, one API, one monorepo.

Customers plan and book trips end-to-end. Service providers (hotels, car rentals, airlines, bus/train operators) list their offerings. Employees moderate listings. Admins control everything.

```
orbyatravel.com              Customer portal
provider.orbyatravel.com     Service provider portal
staff.orbyatravel.com        Employee portal  [Cloudflare Zero Trust]
admin.orbyatravel.com        Admin portal     [Cloudflare Zero Trust]
api.orbyatravel.com          Hono backend
status.orbyatravel.com       Uptime / status page
docs.orbyatravel.com         API + developer docs
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
│   └── api/          Hono — Backend API
│
├── packages/
│   ├── ui/           Shared component library (shadcn/ui base)
│   ├── types/        Shared TypeScript types across all apps
│   ├── db/           Prisma schema + generated client
│   └── config/       Shared ESLint, Tailwind, TypeScript configs
│
├── docker/
│   ├── web.Dockerfile
│   ├── provider.Dockerfile
│   ├── employee.Dockerfile
│   ├── admin.Dockerfile
│   ├── api.Dockerfile
│   ├── Caddyfile                  Reverse proxy + automatic HTTPS
│   ├── docker-compose.yml         Local dev
│   └── docker-compose.prod.yml    Production (DigitalOcean Droplet)
│
├── .github/
│   └── workflows/    CI/CD — GitHub Actions → GHCR → Droplet SSH deploy
│
└── infra/            DigitalOcean provisioning notes
```

**Build tool:** Turborepo. Run `turbo dev` from root to start all apps.

---

## Tech Stack

### Frontend (all four portals)
- Next.js 14, App Router, TypeScript, `output: 'standalone'` (required for Docker)
- Tailwind CSS + shadcn/ui
- Zustand (client state), TanStack Query (server state)
- React Hook Form + Zod (forms + validation)
- Mapbox GL JS (maps)
- Framer Motion (animations)

### Backend (apps/api)
- Hono on Node.js, TypeScript
- Prisma ORM
- PostgreSQL 16 — self-hosted in Docker on the same Droplet
- Redis 7 for caching
- BullMQ on Redis for background job queues
- Meilisearch for full-text search
- Cloudinary for file/image storage and CDN

### Auth
- Auth.js (NextAuth v5) — email/password + Google OAuth
- RBAC middleware — roles: customer, provider, employee, admin
- Cloudflare Zero Trust — gates staff + admin portals entirely

### Payments
- Stripe — customer payments
- Stripe Connect — provider payouts
- Stripe Billing — invoicing

### Notifications
- Brevo (SMTP + transactional email API)
- Twilio — SMS
- Live booking updates — Server-Sent Events via Hono (planned, Phase 3)

### Trip Planner (no LLM for now)
- Rule-based itinerary builder — customer selects destination, dates, traveler count
- System queries available listings and assembles a structured trip object
- Customer picks from returned options, adjusts, confirms
- No AI/LLM involved until explicitly added later
- The trip planner UI is conversational in feel but driven by deterministic search + filter logic

---

## Database — Self-Hosted PostgreSQL

PostgreSQL 16 runs as a Docker container on the same DigitalOcean Droplet. No Supabase, no PgBouncer, no managed service.

```
DATABASE_URL    postgresql://orbya:<password>@postgres:5432/orbya
```

- `DATABASE_URL` is the same URL for both queries and migrations — no split needed
- Prisma schema lives in `packages/db/schema.prisma`
- Run migrations with: `prisma migrate deploy` (runs in a one-shot init container on deploy)
- Data is persisted in a named Docker volume: `postgres_data`
- Backups: daily `pg_dump` to a local file (see `docker/docker-compose.prod.yml`)

**No RLS.** Data isolation between portals is enforced at the application layer via RBAC middleware in the API. The API is the only process that touches the database — portals never connect to Postgres directly.

---

## Core Domain Concepts

### User Roles
```
customer     Books trips, manages profile and bookings
provider     Lists services, manages inventory and payouts
employee     Reviews and moderates listings, handles disputes
admin        Full platform control, user management, feature flags
```

### Listing Types
```
accommodation    Hotels, hostels, guesthouses
flight           Air travel legs
bus              Bus routes and operators
train            Train routes
car_rental       Vehicle rentals
```

### Booking States
```
draft → pending_payment → confirmed → in_progress → completed
                       ↘ cancelled
                       ↘ refunded
```

### Listing Approval States
```
pending → approved
        ↘ rejected  (with reason stored)
        ↘ flagged   (violation, under review)
```

---

## Country & Destination System

Admin controls the list of available destination countries. Customers cannot book anything without selecting a destination first.

### Admin can:
- Add a country: name, ISO code, slug, description, travel advisory level
- Upload multiple hero images per country (stored on Cloudinary, served via CDN)
- Toggle active/inactive — inactive countries are hidden from customer search entirely
- Set a featured flag — featured countries appear on the homepage carousel

### Customer sees:
- Visual country cards (hero image + name) on the trip planner entry screen
- Search and listings are scoped to the selected country
- Cannot proceed to booking without a destination country selected

### Schema (in packages/db/schema.prisma):
```
model Country {
  id               String          @id @default(cuid())
  name             String
  iso_code         String          @unique
  slug             String          @unique
  description      String?
  travel_advisory  AdvisoryLevel   @default(NONE)
  is_active        Boolean         @default(false)
  is_featured      Boolean         @default(false)
  hero_images      CountryImage[]
  listings         Listing[]
  created_at       DateTime        @default(now())
  updated_at       DateTime        @updatedAt
}

model CountryImage {
  id          String   @id @default(cuid())
  country_id  String
  url         String   -- Cloudinary URL
  alt_text    String?
  sort_order  Int      @default(0)
  country     Country  @relation(fields: [country_id], references: [id])
}

enum AdvisoryLevel {
  NONE
  LOW
  MEDIUM
  HIGH
}
```

Country images upload through the API's file upload endpoint. Admin uploads → API validates → uploads to Cloudinary → stores URL in CountryImage table.

---

## Deployment — DigitalOcean Droplet

All services run as Docker containers on a single DigitalOcean Droplet. Caddy handles reverse proxying and automatic HTTPS via Let's Encrypt.

```
Droplet spec:   $18/mo — Premium AMD, 2 vCPU, 2 GB RAM, 60 GB SSD, 3 TB transfer
OS:             Ubuntu 24.04 LTS
Docker:         docker.io + docker-compose-plugin
Image registry: GitHub Container Registry (GHCR) — ghcr.io/orbyatravel/<app>
Compose file:   /opt/orbya/docker/docker-compose.prod.yml
Env vars:       /opt/orbya/.env.prod  (never committed — lives on Droplet only)
```

### Container layout on the Droplet
```
caddy        443/80  →  routes to app containers by hostname
web          3000        orbyatravel.com
provider     3001        provider.orbyatravel.com
employee     3002        staff.orbyatravel.com
admin        3003        admin.orbyatravel.com
api          4000        api.orbyatravel.com
postgres     5432        internal only
redis        6379        internal only
meilisearch  7700        internal only
```

App containers are not exposed on public ports — all traffic enters through Caddy on 80/443.

### DNS and routing
- Cloudflare is the DNS authority for orbyatravel.com
- All five subdomains have A records pointing to the Droplet IP
- Cloudflare proxy is ON — set SSL mode to **Full (strict)**
- staff and admin subdomains are additionally gated by Cloudflare Zero Trust before reaching the Droplet

### One-time Droplet setup (manual)
```bash
apt update && apt install -y docker.io docker-compose-plugin
mkdir -p /opt/orbya/docker
# Copy docker-compose.prod.yml and Caddyfile to /opt/orbya/docker/
# Create /opt/orbya/.env.prod with all production secrets
echo $GITHUB_TOKEN | docker login ghcr.io -u <github-username> --password-stdin
cd /opt/orbya && IMAGE_TAG=<sha> docker compose -f docker/docker-compose.prod.yml up -d
```

---

## CI/CD Pipeline

```
git push origin main
        ↓
GitHub Actions — CI job
  lint (turbo lint) + typecheck (turbo typecheck) + tests (vitest)   ~3 min
        ↓
GitHub Actions — build-and-push job
  builds 5 Docker images in parallel, pushes to GHCR                ~10-15 min
  tags: ghcr.io/orbyatravel/<app>:<git-sha>
        ↓
GitHub Actions — deploy job
  SSH into Droplet
  IMAGE_TAG=<sha> docker compose -f docker/docker-compose.prod.yml pull
  docker compose -f docker/docker-compose.prod.yml up -d --remove-orphans
                                                                     ~2 min
        ↓
Live. Total time push → live: ~15-20 min
```

### Required GitHub Secrets
```
GITHUB_TOKEN      auto-provided (GHCR push)
DO_HOST           Droplet IP address
DO_USER           deploy user (root or orbya)
DO_SSH_KEY        SSH private key for the deploy user
```

### Branching
```
main    production  →  auto-deploys to Droplet on push
dev     staging     →  no auto-deploy (manual docker compose on a second droplet, if needed)
feat/*  feature work
fix/*   bug fixes
```

PRs always target `dev`. Only `dev` merges into `main` after staging sign-off.

---

## Environment Configuration

```
Local dev:    .env.local per app (apps/*/.env.local)
Production:   /opt/orbya/.env.prod on the Droplet — never committed to git
```

Required vars — never hardcode any of these:
```
# Database (self-hosted PostgreSQL)
DATABASE_URL               postgresql://orbya:<password>@postgres:5432/orbya

# Redis
REDIS_URL                  redis://redis:6379

# Auth
NEXTAUTH_SECRET
NEXTAUTH_URL               must match the app's own public domain
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

# Payments
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PUBLISHABLE_KEY

# Email (Brevo)
BREVO_API_KEY
BREVO_SMTP_KEY
BREVO_SMTP_HOST            smtp-relay.brevo.com
BREVO_SMTP_PORT            587

# SMS
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER

# File storage (Cloudinary)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_URL             cloudinary://api_key:api_secret@cloud_name
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

# Maps
MAPBOX_TOKEN

# Search
MEILISEARCH_HOST           http://meilisearch:7700
MEILISEARCH_API_KEY

# PostgreSQL container (used by docker-compose.prod.yml)
POSTGRES_USER              orbya
POSTGRES_PASSWORD          <strong password>
POSTGRES_DB                orbya
```

Each Next.js app also needs `NEXTAUTH_URL` set to its own domain:
```
web        NEXTAUTH_URL=https://orbyatravel.com
provider   NEXTAUTH_URL=https://provider.orbyatravel.com
employee   NEXTAUTH_URL=https://staff.orbyatravel.com
admin      NEXTAUTH_URL=https://admin.orbyatravel.com
```

---

## Security Rules

Non-negotiable. Do not write code that violates these.

1. No secrets in code or git history. Env vars only. Flag any hardcoded key immediately.
2. The API is the only process that connects to PostgreSQL. Portals never get a DATABASE_URL.
3. RBAC middleware runs on every API route. Role check happens before any business logic.
4. staff and admin portals have no public route. Cloudflare Zero Trust blocks before the container sees the request. You still need RBAC inside the app for employee vs admin role separation.
5. All file uploads go through the API. The API validates type and size, then uploads to Cloudinary. No direct client-to-Cloudinary uploads with server-side credentials.
6. Stripe webhook payloads are always verified with `stripe.webhooks.constructEvent` before processing.
7. Do not modify SPF/DKIM/DMARC DNS records without understanding what you're changing.
8. `/opt/orbya/.env.prod` on the Droplet must be `chmod 600` and owned by the deploy user only.

---

## Build Status

```
Phase 0   Infrastructure + accounts       [✅ complete]
Phase 1   Database schema (ERD + Prisma)  [✅ complete]
Phase 2   Backend API (Hono)              [🔄 in progress — routes scaffolded]
Phase 3   Customer portal (web)           [🔄 in progress — see below]
Phase 4   Service provider portal         [✅ core complete — see below]
Phase 5   Employee portal                 [✅ core complete — see below]
Phase 6   Admin portal                    [✅ core complete — see below]
Phase 7   DevOps + CI/CD                  [🔄 in progress — Docker + DO deploy]
Phase 8   Testing + launch                [⬜ not started]
```

### Provider Portal — What's Built

**Onboarding / profile setup:**
- Multi-step wizard at `/profile/setup` (Step 1: service types, Step 2: business info, Step 3: business type + registration number, Step 4: location, Step 5: photo upload 2–7 images via Cloudinary)
- Schema enums: `BusinessType` (PERSONAL | VAT_REGISTERED | PAN_REGISTERED), `VerificationStatus` (PENDING | APPROVED | REJECTED)
- `ProviderImage` model storing Cloudinary URLs per provider
- `/api/upload` — server-side Cloudinary upload (validates type + 10MB limit), stores URL
- `/api/profile` — GET/POST/PATCH for provider profile inc. photos

**Verification flow:**
- After signup → PENDING, shown "under review" screen
- If REJECTED → shown rejection note + link to resubmit via setup wizard
- If APPROVED → full dashboard with listing management

**Listings:**
- Full CRUD for Hotels, Car Rentals, Buses, Flights, Trains
- `/api/listings` handles all 5 types in a single transaction (creates detail record)
- Analytics page, Payouts placeholder

**Auth:**
- `/api/auth/[...nextauth]/route.ts` exists in provider app (was missing, caused 404)
- `NEXTAUTH_SECRET` and `DATABASE_URL` required in each app's own `.env.local`

### Employee Portal — What's Built

- Dashboard with listing stats (pending/approved/rejected/flagged counts)
- **Queue** — pending listings with approve/reject/flag actions
- **Providers** — review provider applications (PENDING/APPROVED/REJECTED) with expandable detail, photos, approve button, reject modal with required note
- **Disputes** — flagged listings table
- `/api/listings/[id]` PATCH — EMPLOYEE role, updates `approval_status`
- `/api/providers/[id]` PATCH — EMPLOYEE role, updates `verification_status` + `verification_note`

### Admin Portal — What's Built

- **Users** — table of all users with inline role selector (CUSTOMER/PROVIDER/EMPLOYEE/ADMIN), change takes effect immediately via `/api/users/[id]` PATCH
- **Providers** — table with `verification_status` badge + `is_verified` toggle (syncs both fields)
- **Listings** — approval management (approve/reject/flag)
- **Countries** — destination management
- **Revenue** — booking stats

### Web Portal (Customer) — What's Built

- Public browsing enabled — only `/bookings`, `/profile`, `/trips` require auth
- Non-customer roles redirected to their own portals on sign-in
- Countries / destinations browsable without login

### Prisma Schema Additions (since initial plan)

```prisma
enum BusinessType     { PERSONAL VAT_REGISTERED PAN_REGISTERED }
enum VerificationStatus { PENDING APPROVED REJECTED }

model ProviderProfile {
  // ... existing fields ...
  service_types       String[]
  business_type       BusinessType       @default(PERSONAL)
  registration_number String?
  city                String?
  area                String?
  zip_code            String?
  latitude            Decimal?           @db.Decimal(10, 7)
  longitude           Decimal?           @db.Decimal(10, 7)
  verification_status VerificationStatus @default(PENDING)
  verification_note   String?            @db.Text
  photos              ProviderImage[]
}

model ProviderImage {
  id            String  @id @default(cuid())
  provider_id   String
  url           String
  cloudinary_id String?
  alt_text      String?
  sort_order    Int     @default(0)
  provider      ProviderProfile @relation(...)
}
```

### What's NOT Yet Built

- Customer trip search, filters, and booking flow (Phase 3 core)
- Trip planner (rule-based itinerary assembly)
- Stripe payment integration
- Email notifications (Brevo)
- SMS notifications (Twilio)
- Meilisearch full-text search
- Map view for providers (Mapbox GL)
- Google OAuth
- Real-time booking updates (SSE)
- GitHub Actions CI/CD pipeline

LLM/AI integration is explicitly out of scope for now. Do not add AI SDK dependencies, do not wire Claude API, do not stub AI endpoints. The trip planner is deterministic for the foreseeable future.

---

## Conventions

### Naming
- DB tables: `snake_case`, plural (`bookings`, `listings`, `country_images`)
- TypeScript types/interfaces: `PascalCase`
- API routes: `/v1/resource/:id`, RESTful
- React components: `PascalCase`, colocated with styles
- Env vars: `SCREAMING_SNAKE_CASE`

### API response shape
```ts
// success
{ data: T, meta?: PaginationMeta }

// error
{ error: { code: string, message: string, details?: unknown } }
```

### Commit style
```
feat: add country image upload endpoint
fix: booking state transition guard on cancelled orders
chore: update prisma client after schema migration
```

---

## Known Constraints and Gotchas

- **2 GB RAM is tight.** All 8 containers together use ~1.3–1.5 GB. Do not add memory-hungry services without checking headroom first. Tune Meilisearch and PostgreSQL conservatively (`shared_buffers=128MB`, `MEILI_MAX_INDEXING_MEMORY=200mb`).
- **BullMQ workers run inside the API container.** The Hono HTTP server and the BullMQ worker share the same Node process (started together in `apps/api/src/index.ts`). This is fine for the Droplet — no separate worker process needed.
- **Prisma migrations run as a one-shot init container** (`migrate` service in docker-compose.prod.yml) before the api container starts. Never run `prisma migrate dev` in production.
- **Meilisearch index is eventually consistent with Postgres.** BullMQ jobs sync on listing create/update/delete. Never use Meilisearch for anything requiring transactional accuracy.
- **Turborepo caches builds aggressively.** If you see stale output, run `turbo clean` before investigating further.
- **Cloudflare Zero Trust on staff/admin** means those containers never see unauthenticated traffic. You still need RBAC inside for employee vs admin role separation — Zero Trust only checks identity, not role.
- **Docker image builds happen in GitHub Actions, not on the Droplet.** Never run `docker build` on the Droplet — it will OOM on 2 GB RAM.
- **Caddy handles TLS automatically.** Do not configure Let's Encrypt manually. Caddy obtains and renews certificates on first request. Ensure ports 80 and 443 are open in the Droplet firewall.
- **Postgres data lives in a Docker volume (`postgres_data`).** Destroying the volume destroys all data. Never run `docker compose down -v` in production.
- **`packages/db` Prisma singleton is lazy.** `packages/db/src/index.ts` uses a `Proxy` to defer `PrismaClient` creation until the first query. This avoids a timing issue in Next.js dev where the module is evaluated before `.env.local` env vars are loaded into `process.env`. If you see `PrismaClientInitializationError: Environment variable not found: DATABASE_URL` in dev, restart the dev servers (`pnpm dev`). Never remove the Proxy pattern — reverting to eager init will re-introduce the bug.
- **Each Next.js app must have its own `.env.local`.** Next.js only reads `.env.local` from the app directory (where `next.config.js` lives). The root `.env.local` is not inherited by portal apps. Every app needs at minimum `NEXTAUTH_SECRET`, `DATABASE_URL`, and `NEXTAUTH_URL` pointing to its own port.
- **Provider onboarding requires employee verification.** A newly registered provider lands at `/profile/setup`, submits the wizard, and is set to `verification_status: PENDING`. They see an "under review" screen on the dashboard. An employee (at `/providers`) must APPROVE before the provider gains access to the listing dashboard. If REJECTED, the provider sees the reviewer note and a resubmit button.
- **Admin role management.** The default role for new sign-ups is `CUSTOMER`. Admins change roles via the inline dropdown on `/users`. The API route `PATCH /api/users/[id]` accepts `{ role }` and validates the caller is ADMIN.

---

## Quick Reference: Port Map (local dev)

```
3000    apps/web        Customer portal
3001    apps/provider   Provider portal
3002    apps/employee   Employee portal
3003    apps/admin      Admin portal
4000    apps/api        Hono API
5432    PostgreSQL
6379    Redis
7700    Meilisearch
```

---

*Keep this file updated as architecture decisions change. New service, new env var, changed convention — update CLAUDE.md in the same PR.*
