# CLAUDE.md — Orbya Travel Platform

> Claude Code context file. Read this before touching any file in this repo.
> Last updated: June 2026

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
│   ├── docker-compose.yml         Local dev
│   └── docker-compose.prod.yml    Production reference
│
├── .github/
│   └── workflows/    CI/CD — GitHub Actions
│
└── infra/            Azure bicep/scripts, provisioning notes
```

**Build tool:** Turborepo. Run `turbo dev` from root to start all apps.

---

## Tech Stack

### Frontend (all four portals)
- Next.js 14, App Router, TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (client state), TanStack Query (server state)
- React Hook Form + Zod (forms + validation)
- Mapbox GL JS (maps)
- Framer Motion (animations)

### Backend (apps/api)
- Hono on Node.js, TypeScript
- Prisma ORM
- PostgreSQL via Supabase (managed cloud, not self-hosted)
- Redis for caching
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
- Supabase Realtime — live booking status updates in UI

### Trip Planner (no LLM for now)
- Rule-based itinerary builder — customer selects destination, dates, traveler count
- System queries available listings and assembles a structured trip object
- Customer picks from returned options, adjusts, confirms
- No AI/LLM involved until explicitly added later
- The trip planner UI is conversational in feel but driven by deterministic search + filter logic

---

## Database — Supabase (Managed Cloud)

Using **Supabase cloud** (supabase.com), not self-hosted. The database is standard PostgreSQL but the connection strings and auth tokens come from the Supabase dashboard.

```
DATABASE_URL        pooled connection (PgBouncer) — use for queries
DIRECT_URL          direct connection — use only for migrations (prisma migrate)
```

- Prisma schema lives in `packages/db/schema.prisma`
- Run migrations with: `prisma migrate deploy` (uses DIRECT_URL)
- Row Level Security (RLS) is ON — each portal only sees its own data
- PgBouncer is handled by Supabase automatically on the pooled URL
- Backups are managed by Supabase on paid plan — verify backup retention in dashboard

**Never bypass RLS.** Cross-portal data access goes through Supabase service role on server-side only, never exposed to client.

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
- Upload multiple hero images per country (stored on Cloudflare R2, served via CDN)
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

Country images upload through the API's file upload endpoint, same as provider media. Admin uploads -> API validates -> uploads to Cloudinary -> stores URL in CountryImage table.

---

## Deployment — Vercel

All Next.js apps are deployed on **Vercel**. Each app is a separate Vercel project linked to this monorepo, with its root directory set to the relevant `apps/*` folder.

```
Vercel Project        App dir          Domain
------------------------------------------------------
orbya-web             apps/web         orbyatravel.com
orbya-provider        apps/provider    provider.orbyatravel.com
orbya-employee        apps/employee    staff.orbyatravel.com
orbya-admin           apps/admin       admin.orbyatravel.com
orbya-api             apps/api         api.orbyatravel.com (Vercel Serverless/Edge)
```

### DNS and routing
- Cloudflare is the DNS authority for orbyatravel.com
- Each Vercel project has its custom domain configured in the Vercel dashboard
- Cloudflare proxies traffic — set SSL mode to **Full (strict)** to avoid redirect loops
- staff and admin subdomains additionally gated by Cloudflare Zero Trust before reaching Vercel

### Local dev vs production
```
Local dev:    Docker Compose (docker/docker-compose.yml) or turbo dev
              All services on localhost with port map below
              Uses .env.local per app

Production:   Vercel
              Env vars set per-project in Vercel dashboard (or via Vercel CLI)
              Uses production values stored in Vercel environment variables
```

### Important Vercel env vars per app
Each Vercel project must have `NEXTAUTH_URL` set to its own public domain:
```
orbya-admin     NEXTAUTH_URL=https://admin.orbyatravel.com
orbya-employee  NEXTAUTH_URL=https://staff.orbyatravel.com
orbya-web       NEXTAUTH_URL=https://orbyatravel.com
orbya-provider  NEXTAUTH_URL=https://provider.orbyatravel.com
```

---

## CI/CD Pipeline

```
GitHub Push
    |
GitHub Actions (CI) + Vercel (deploy)
    |-- lint + typecheck (turbo lint)     [GitHub Actions]
    |-- run tests (Vitest)                [GitHub Actions]
    |-- Vercel auto-deploys on push       [Vercel Git integration]

PR opened         preview deployment per PR (Vercel preview URL)
merge to dev      deploy to staging (Vercel dev/staging environment)
merge to main     deploy to production (Vercel production environment)
```

Vercel watches the repo via its GitHub integration and deploys automatically. The GitHub Actions workflow handles lint/test only — no manual deploy steps needed.

---

## Environment Configuration

```
.env.local         Local dev (per app in apps/*)
```

Production env vars are set in the **Vercel dashboard** per project. Required vars — never hardcode any of these:
```
# Database (Supabase)
DATABASE_URL               pooled URL from Supabase dashboard
DIRECT_URL                 direct URL — migrations only

# Redis
REDIS_URL

# Auth
NEXTAUTH_SECRET
NEXTAUTH_URL               must match the app's own public domain (see Deployment section)
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
MEILISEARCH_HOST
MEILISEARCH_API_KEY

# Supabase (for Realtime + service role)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## Security Rules

Non-negotiable. Do not write code that violates these.

1. No secrets in code or git history. Env vars only. Flag any hardcoded key immediately.
2. RLS is on for all Supabase tables. Service role key is server-side only, never in client bundles.
3. staff and admin portals have no public route. Cloudflare Zero Trust blocks before the container sees the request. You still need RBAC inside the app for employee vs admin separation.
4. RBAC middleware runs on every API route. Role check happens before any business logic.
5. All file uploads go through the API. The API validates type and size, then uploads to Cloudinary. No direct client-to-Cloudinary uploads with server-side credentials.
6. Stripe webhook payloads are always verified with `stripe.webhooks.constructEvent` before processing.
7. Do not modify SPF/DKIM/DMARC DNS records without understanding what you're changing.

---

## What Is Not Built Yet

```
Phase 0   Infrastructure + accounts       [in progress]
Phase 1   Database schema (ERD + Prisma)  [not started]
Phase 2   Backend API (Hono)              [not started]
Phase 3   Customer portal                 [not started]
Phase 4   Service provider portal         [not started]
Phase 5   Employee portal                 [not started]
Phase 6   Admin portal                    [not started]
Phase 7   DevOps + CI/CD                  [not started]
Phase 8   Testing + launch                [not started]
```

Start at Phase 1. Everything downstream depends on the schema being correct.

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

### Branching
```
main      production
dev       staging / integration
feat/*    feature work
fix/*     bug fixes
```

PRs always target `dev`. Only `dev` merges into `main` after staging sign-off.

---

## Known Constraints and Gotchas

- Supabase cloud free tier has a 500MB DB limit and pauses inactive projects after 1 week. Use the paid tier for anything beyond local development.
- Vercel serverless functions have a 10s (Hobby) / 60s (Pro) execution timeout. Long-running jobs (BullMQ workers) cannot run inside Vercel — they need a separate always-on process (Railway, Render, a VPS, etc.).
- BullMQ workers are separate from the Hono HTTP server. They must run outside Vercel. The worker process must be running for background jobs (email, SMS, search sync) to process.
- Meilisearch index is eventually consistent with Postgres. BullMQ jobs sync on listing create/update/delete. Never use Meilisearch for anything that requires transactional accuracy.
- Turborepo caches builds aggressively. If you see stale output, run `turbo clean` before investigating further.
- Prisma migrations require `DIRECT_URL` (not the pooled URL). PgBouncer drops the prepared statements that Prisma's migration engine needs. Always set both vars.
- Cloudflare Zero Trust on staff/admin means those containers never see unauthenticated traffic. You still need RBAC inside for employee vs admin role separation — Zero Trust only checks identity, not role.

---

## Quick Reference: Port Map (local dev)

```
3000    apps/web        Customer portal
3001    apps/provider   Provider portal
3002    apps/employee   Employee portal
3003    apps/admin      Admin portal
4000    apps/api        Hono API
5432    PostgreSQL      (local Supabase or direct Postgres for dev)
6379    Redis
7700    Meilisearch
```

---

*Keep this file updated as architecture decisions change. New service, new env var, changed convention — update CLAUDE.md in the same PR.*
