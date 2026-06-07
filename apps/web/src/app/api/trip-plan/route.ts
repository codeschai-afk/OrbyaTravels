import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import Groq from 'groq-sdk'
import { z } from 'zod'

const schema = z.object({
  country_id:    z.string(),
  bucket_list:   z.array(z.string()),            // ordered place IDs (user-sorted)
  day_hints:     z.record(z.string(), z.number()).optional(), // place_id → preferred day
  duration_days: z.number().min(1).max(30),
  travel_style:  z.enum(['BUDGET', 'COMFORT', 'LUXURY']),
})

export async function POST(req: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to generate a trip plan' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { country_id, bucket_list, day_hints = {}, duration_days, travel_style } = body.data

  const [country, bucketPlaces, allPlaces, providerListings] = await Promise.all([
    prisma.country.findUnique({ where: { id: country_id }, select: { id: true, name: true, slug: true } }),

    bucket_list.length > 0
      ? prisma.place.findMany({
          where:  { id: { in: bucket_list } },
          select: { id: true, name: true, city: true, category: true, description: true },
        })
      : Promise.resolve([] as { id: string; name: string; city: string | null; category: string; description: string | null }[]),

    prisma.place.findMany({
      where:  { country_id, is_active: true },
      select: { name: true, city: true, category: true, description: true },
      take:   25,
    }),

    prisma.listing.findMany({
      where: { country_id, approval_status: 'APPROVED', is_active: true },
      select: {
        id: true, title: true, type: true, base_price: true, description: true,
        provider:      { select: { business_name: true, city: true } },
        accommodation: { select: { city: true, stars: true, address: true, amenities: true } },
        car_rental:    { select: { make: true, model: true, year: true, pickup_location: true, seats: true, features: true } },
        bus:           { select: { operator: true, origin_city: true, destination_city: true, bus_type: true } },
        train:         { select: { operator: true, origin_city: true, destination_city: true } },
        flight:        { select: { airline: true, origin_city: true, destination_city: true, duration_minutes: true } },
      },
      take: 40,
    }),
  ])

  if (!country) return NextResponse.json({ error: 'Country not found' }, { status: 404 })

  const listingByTitle = new Map(providerListings.map((l) => [l.title.toLowerCase(), l]))

  // ── Style-specific provider filtering ───────────────────────────────────────
  // Only inject listings that match the travel style to prevent cross-contamination
  const stays = providerListings.filter((l) => l.type === 'ACCOMMODATION')

  const allTransport = providerListings.filter((l) => l.type !== 'ACCOMMODATION')
  const transport = (() => {
    if (travel_style === 'LUXURY')  return allTransport.filter((l) => l.type === 'CAR_RENTAL')
    if (travel_style === 'BUDGET')  return allTransport.filter((l) => ['BUS', 'TRAIN'].includes(l.type))
    // COMFORT: if car rentals exist, show only cars (don't mix with buses — confuses AI)
    const carRentals = allTransport.filter((l) => l.type === 'CAR_RENTAL')
    return carRentals.length > 0 ? carRentals : allTransport
  })()

  // ── Style guide ──────────────────────────────────────────────────────────────
  const styleGuide = {
    BUDGET:  'budget-friendly (hostels/cheap guesthouses, local public buses/shared transport, street food, free attractions)',
    COMFORT: 'comfortable mid-range (3-star hotels, mix of private car and public transport, local restaurants)',
    LUXURY:  'full luxury (4-5 star hotels, private car service for every journey, fine dining, exclusive experiences)',
  }[travel_style]

  const transportRule = {
    BUDGET: `TRANSPORT RULES FOR BUDGET:
- NEVER suggest car rentals — they are far too expensive for budget travel.
- Use local public buses, shared jeeps, rickshaws, or on foot.
- Only reference our verified BUS/TRAIN listings (shown below) if they match the route.
- If no bus/train listing exists, describe generic local transport without a specific provider name.`,

    COMFORT: `TRANSPORT RULES FOR COMFORT:
- If ANY car rental listing exists in our verified providers list, use it for EVERY transport leg throughout the trip — including within-city travel.
- Car rental gives a comfortable, private experience which is exactly what COMFORT travelers expect.
- Only fall back to local bus/taxi if the verified providers list has NO car rental listings.
- NEVER mix car rental and local bus in the same plan when a car rental is available.`,

    LUXURY: `TRANSPORT RULES FOR LUXURY:
- Every single transport leg MUST use a private car from our verified CAR_RENTAL listings.
- NEVER suggest local buses, shared jeeps, taxis, or public transport — luxury travelers expect private service.
- If no car rental listing is available, describe "private car transfer" generically without a provider name.
- In edit mode, users can swap to local options themselves if they choose.`,
  }[travel_style]

  const accommodationRule = {
    BUDGET: `ACCOMMODATION RULES FOR BUDGET:
- Only use our verified budget accommodation listings (shown below) if available.
- If no budget listing exists, describe a "hostel" or "budget guesthouse" generically without inventing a specific name.
- DO NOT invent hotel names. If no real listing matches, say "Local hostel in [city]".`,

    COMFORT: `ACCOMMODATION RULES FOR COMFORT:
- Prefer our verified accommodation listings.
- If no listing matches, describe "a 3-star hotel" generically without inventing a name.`,

    LUXURY: `ACCOMMODATION RULES FOR LUXURY:
- Use our verified accommodation listings (4-5 star preferred).
- If no listing available, describe "a 5-star hotel" generically without inventing a name.
- DO NOT invent hotel names.`,
  }[travel_style]

  // ── Bucket list in user-specified order with day hints ────────────────────────
  // Preserve the user's ordering (bucket_list is already sorted by user)
  const orderedBucket = bucket_list
    .map((id) => bucketPlaces.find((p) => p.id === id))
    .filter(Boolean) as typeof bucketPlaces

  const bucketSection = orderedBucket.length > 0
    ? orderedBucket.map((p, i) => {
        const dayHint = day_hints[p.id]
        return `${i + 1}. ${p.name} (${p.category.toLowerCase()}) in ${p.city || country.name}${dayHint ? ` — USER WANTS THIS ON DAY ${dayHint}` : ''}${p.description ? ': ' + p.description.slice(0, 100) : ''}`
      }).join('\n')
    : 'None specified — choose the best places from the attractions list below'

  // ── Provider descriptions ──────────────────────────────────────────────────
  function describeStay(l: typeof stays[number]): string {
    const a = l.accommodation
    return [
      `"${l.title}"`,
      a?.city && `in ${a.city}`,
      a?.stars ? `${a.stars}★` : 'unrated',
      `$${Number(l.base_price)}/night`,
      `by ${l.provider.business_name}`,
      a?.amenities?.length ? `(${a.amenities.slice(0, 3).join(', ')})` : '',
    ].filter(Boolean).join(' — ')
  }

  function describeTransport(l: typeof transport[number]): string {
    const c = l.car_rental; const b = l.bus; const t = l.train; const f = l.flight
    if (c) return `"${l.title}" — ${c.make} ${c.model} (${c.year}), ${c.seats} seats, pickup: ${c.pickup_location}, $${Number(l.base_price)}/day by ${l.provider.business_name}`
    if (b) return `"${l.title}" — ${b.bus_type} bus from ${b.origin_city} to ${b.destination_city} by ${b.operator}, $${Number(l.base_price)}/person`
    if (t) return `"${l.title}" — Train from ${t.origin_city} to ${t.destination_city} by ${t.operator}, $${Number(l.base_price)}/person`
    if (f) return `"${l.title}" — ${f.airline} flight ${f.origin_city} → ${f.destination_city}, $${Number(l.base_price)}/person`
    return `"${l.title}" — $${Number(l.base_price)}/unit by ${l.provider.business_name}`
  }

  const prompt = `You are a world-class travel planner for Orbya, a curated travel platform. Create a ${duration_days}-day ${travel_style.toLowerCase()} trip itinerary for ${country.name}.

TRAVEL STYLE: ${styleGuide}

${transportRule}

${accommodationRule}

CRITICAL RULES — READ CAREFULLY:
1. When you use a provider listing from our database, set that leg's "title" to EXACTLY match the listing title shown in quotes. This is how we link real bookings.
2. DO NOT invent specific business names. Either use one from our listings or describe generically.
3. ALWAYS respect the user's day preferences (marked as "USER WANTS THIS ON DAY X").
4. ALWAYS visit places in the order listed in the user's priority list (top = visit first).
5. This trip is ${duration_days} days — create exactly ${duration_days} day objects, no more, no less.

USER'S PRIORITY PLACES (visit in this order, respect day assignments):
${bucketSection}

OTHER NOTABLE ATTRACTIONS IN ${country.name.toUpperCase()}:
${allPlaces.map((p) => `- ${p.name} (${p.category.toLowerCase()}) in ${p.city || country.name}`).join('\n') || 'No data yet'}

${stays.length > 0 ? `OUR VERIFIED ACCOMMODATION (${travel_style} style — use exact titles):
${stays.map(describeStay).join('\n')}` : 'No accommodation listings available — describe options generically.'}

${transport.length > 0 ? `OUR VERIFIED TRANSPORT (${travel_style} style — use exact titles):
${transport.map(describeTransport).join('\n')}` : travel_style === 'LUXURY' ? 'No car rental listings yet — describe "private car transfer" generically.' : 'No transport listings yet — describe local transport options generically.'}

Return ONLY valid JSON (no markdown, no explanation):
{
  "title": "string — creative trip title reflecting the ${travel_style.toLowerCase()} style and destination",
  "days": [
    {
      "day": 1,
      "title": "string — day theme",
      "notes": "string — brief overview of the day",
      "legs": [
        {
          "type": "PLACE" | "TRANSPORT" | "ACCOMMODATION",
          "title": "string — exact provider title OR descriptive generic name",
          "description": "string — what to do, travel details, or why this stay is great",
          "duration_minutes": 120,
          "tip": "string — practical insider advice for this leg"
        }
      ]
    }
  ]
}`

  let raw: any
  try {
    const completion = await groq.chat.completions.create({
      model:           'llama-3.3-70b-versatile',
      messages:        [{ role: 'user', content: prompt }],
      temperature:     0.65,
      max_tokens:      4096,
      response_format: { type: 'json_object' },
    })
    raw = JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch (e) {
    console.error('Groq error:', e)
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 502 })
  }

  if (!raw?.days?.length) {
    return NextResponse.json({ error: 'AI returned an invalid plan. Try again.' }, { status: 502 })
  }

  // Post-process: match leg titles to real listing IDs
  const days = (raw.days as any[]).map((day: any) => ({
    day_number: day.day,
    title:      day.title ?? `Day ${day.day}`,
    notes:      day.notes ?? '',
    legs: ((day.legs ?? []) as any[]).map((leg: any, i: number) => {
      const matchedListing = leg.type !== 'PLACE'
        ? (listingByTitle.get((leg.title ?? '').toLowerCase()) ?? null)
        : null
      return {
        order:            i,
        type:             leg.type ?? 'PLACE',
        title:            leg.title ?? 'Activity',
        description:      leg.description ?? '',
        duration_minutes: leg.duration_minutes ?? null,
        tip:              leg.tip ?? null,
        listing_id:       matchedListing?.id ?? null,
      }
    }),
  }))

  const plan = await prisma.tripPlan.create({
    data: {
      user_id:      session.user.id,
      country_id:   country.id,
      title:        raw.title ?? `${duration_days} days in ${country.name}`,
      duration_days,
      travel_style,
      raw_response: raw,
      days: {
        create: days.map((day) => ({
          day_number: day.day_number,
          title:      day.title,
          notes:      day.notes,
          legs: {
            create: day.legs.map((leg) => ({
              order:            leg.order,
              type:             leg.type,
              title:            leg.title,
              description:      leg.description,
              duration_minutes: leg.duration_minutes,
              tip:              leg.tip,
              listing_id:       leg.listing_id,
            })),
          },
        })),
      },
    },
  })

  return NextResponse.json({ plan_id: plan.id })
}
