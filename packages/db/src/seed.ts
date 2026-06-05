import { PrismaClient } from '../generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const password = process.env.SEED_PASSWORD ?? 'password123'

const users = [
  { email: 'admin@orbyatravel.com',    name: 'Admin User',    role: 'ADMIN'    as const },
  { email: 'employee@orbyatravel.com', name: 'Employee User', role: 'EMPLOYEE' as const },
  { email: 'provider@orbyatravel.com', name: 'Provider User', role: 'PROVIDER' as const },
  { email: 'customer@orbyatravel.com', name: 'Customer User', role: 'CUSTOMER' as const },
]

const countries = [
  { name: 'India',     iso_code: 'IN', slug: 'india',     description: 'Ancient temples, spice markets & the Himalayas', is_featured: true,  travel_advisory: 'NONE' as const },
  { name: 'Nepal',     iso_code: 'NP', slug: 'nepal',     description: 'Rooftop of the world — Everest base camps & spiritual valleys', is_featured: true, travel_advisory: 'NONE' as const },
  { name: 'Japan',     iso_code: 'JP', slug: 'japan',     description: 'Ancient temples & futuristic cities',              is_featured: true,  travel_advisory: 'NONE' as const },
  { name: 'Italy',     iso_code: 'IT', slug: 'italy',     description: 'Renaissance art & coastal villages',                is_featured: true,  travel_advisory: 'NONE' as const },
  { name: 'Thailand',  iso_code: 'TH', slug: 'thailand',  description: 'Tropical beaches & golden temples',                 is_featured: true,  travel_advisory: 'NONE' as const },
  { name: 'France',    iso_code: 'FR', slug: 'france',    description: 'Lavender fields & haute cuisine',                   is_featured: true,  travel_advisory: 'NONE' as const },
  { name: 'Greece',    iso_code: 'GR', slug: 'greece',    description: 'Whitewashed villages & crystal waters',             is_featured: false, travel_advisory: 'NONE' as const },
  { name: 'Morocco',   iso_code: 'MA', slug: 'morocco',   description: 'Sahara dunes & spice bazaars',                      is_featured: false, travel_advisory: 'LOW'  as const },
  { name: 'Indonesia', iso_code: 'ID', slug: 'indonesia', description: 'Rice terraces, volcanoes & coral reefs',            is_featured: false, travel_advisory: 'NONE' as const },
  { name: 'Spain',     iso_code: 'ES', slug: 'spain',     description: 'Flamenco, tapas & sun-soaked beaches',              is_featured: false, travel_advisory: 'NONE' as const },
]

async function main() {
  const hash = await bcrypt.hash(password, 12)

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password_hash: hash, role: u.role },
      create: { email: u.email, name: u.name, password_hash: hash, role: u.role },
    })
    console.log(`${u.role.padEnd(8)} ready: ${user.email}`)
  }

  console.log(`\nAll users → password: ${password}`)

  for (const c of countries) {
    const country = await prisma.country.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, is_featured: c.is_featured, travel_advisory: c.travel_advisory, is_active: true },
      create: { ...c, is_active: true },
    })
    console.log(`Country   seeded: ${country.name}`)
  }

  console.log('\nSeed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
