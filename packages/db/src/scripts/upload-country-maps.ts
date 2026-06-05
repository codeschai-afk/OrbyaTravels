/**
 * Fetches topographic relief images for each country from ESRI's World Physical Map
 * and uploads them to Cloudinary as country hero images.
 *
 * Reads credentials from env vars. Load them from provider/.env.local before running:
 *
 *   export $(cat apps/provider/.env.local | xargs) && pnpm --filter @orbyatravel/db seed:maps
 */

import { createHash } from 'crypto'
import { prisma } from '../index'

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  DATABASE_URL,
} = process.env

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !DATABASE_URL) {
  console.error('Missing env vars. Export from apps/provider/.env.local first:')
  console.error('  export $(grep -v "^#" apps/provider/.env.local | xargs)')
  process.exit(1)
}

// ── Country bounding boxes [west, south, east, north] ──────────────────────
const COUNTRIES: Array<{ slug: string; name: string; bbox: [number, number, number, number] }> = [
  { slug: 'india',     name: 'India',     bbox: [65.5,  6.5, 100.0, 37.5] },
  { slug: 'nepal',     name: 'Nepal',     bbox: [78.5, 25.0,  89.5, 31.5] },
  { slug: 'japan',     name: 'Japan',     bbox: [119.5, 22.5, 156.0, 47.0] },
  { slug: 'italy',     name: 'Italy',     bbox: [4.5,  35.0,  20.0, 48.5] },
  { slug: 'thailand',  name: 'Thailand',  bbox: [95.0,  4.0, 108.0, 22.0] },
  { slug: 'france',    name: 'France',    bbox: [-7.0, 40.0,  11.5, 52.5] },
  { slug: 'greece',    name: 'Greece',    bbox: [17.5, 33.5,  30.5, 42.5] },
  { slug: 'morocco',   name: 'Morocco',   bbox: [-18.5, 26.0,  1.0, 37.5] },
  { slug: 'indonesia', name: 'Indonesia', bbox: [91.0, -13.5, 143.0,  8.5] },
  { slug: 'spain',     name: 'Spain',     bbox: [-11.0, 34.0,   6.5, 45.5] },
]

// ── Fetch terrain PNG from ESRI static export API ──────────────────────────
async function fetchTerrainPng(bbox: [number, number, number, number]): Promise<ArrayBuffer> {
  const [west, south, east, north] = bbox
  // ESRI World Physical Map — topographic relief with green land + blue ocean
  const url = [
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/export',
    `?bbox=${west},${south},${east},${north}`,
    '&bboxSR=4326',
    '&size=1920,1080',
    '&imageSR=4326',
    '&format=png',
    '&transparent=false',
    '&f=image',
  ].join('')

  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESRI ${res.status}: ${await res.text()}`)
  return res.arrayBuffer()
}

// ── Sign + upload to Cloudinary via REST API ───────────────────────────────
function sign(params: Record<string, string>): string {
  const str = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&')
  return createHash('sha1').update(str + CLOUDINARY_API_SECRET).digest('hex')
}

async function uploadToCloudinary(data: ArrayBuffer, publicId: string): Promise<string> {
  const timestamp = Math.round(Date.now() / 1000).toString()
  const params    = { public_id: publicId, timestamp }
  const signature = sign(params)

  const form = new FormData()
  form.append('file', new Blob([data], { type: 'image/png' }), 'terrain.png')
  form.append('public_id',  publicId)
  form.append('timestamp',  timestamp)
  form.append('api_key',    CLOUDINARY_API_KEY!)
  form.append('signature',  signature)

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body:   form,
  })
  const json = await res.json() as { secure_url?: string; error?: { message: string } }
  if (json.error) throw new Error(json.error.message)
  return json.secure_url!
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🗺️  Orbya — Country Terrain Map Uploader\n')

  for (const { slug, name, bbox } of COUNTRIES) {
    process.stdout.write(`  ${name.padEnd(12)} `)

    const country = await prisma.country.findUnique({ where: { slug } })
    if (!country) {
      console.log('⚠️  not in DB, skipping')
      continue
    }

    try {
      process.stdout.write('fetching ESRI… ')
      const buffer = await fetchTerrainPng(bbox)

      process.stdout.write('uploading… ')
      const url = await uploadToCloudinary(buffer, `orbyatravel/countries/terrain_${slug}`)

      // Remove old terrain images and insert the new one at sort_order 0
      await prisma.$transaction([
        prisma.countryImage.deleteMany({
          where: { country_id: country.id, url: { contains: 'terrain_' } },
        }),
        prisma.countryImage.create({
          data: {
            country_id: country.id,
            url,
            alt_text:   `${name} terrain relief map`,
            sort_order: 0,
          },
        }),
      ])

      console.log(`✓ ${url}`)
    } catch (err) {
      console.log(`✗ ${(err as Error).message}`)
    }
  }

  console.log('\n✅  Done\n')
  await prisma.$disconnect()
}

main()
