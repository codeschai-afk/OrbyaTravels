import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@orbyatravel/db'
import Groq from 'groq-sdk'
import { z } from 'zod'

const schema = z.object({
  country_id:    z.string(),
  bucket_list:   z.array(z.string()),
  duration_days: z.number().min(1).max(30),
  travel_style:  z.enum(['BUDGET', 'COMFORT', 'LUXURY']),
})

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to generate a trip plan' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { country_id, bucket_list, duration_days, travel_style } = body.data

  // Fetch context
  const [country, bucketPlaces, allPlaces, listings] = await Promise.all([
    prisma.country.findUnique({ where: { id: country_id }, select: { id: true, name: true, slug: true } }),
    bucket_list.length > 0
      ? prisma.place.findMany({ where: { id: { in: bucket_list } }, select: { name: true, city: true, category: true, description: true, latitude: true, longitude: true } })
      : [],
    prisma.place.findMany({ where: { country_id, is_active: true }, select: { name: true, city: true, category: true, description: true }, take: 20 }),
    prisma.listing.findMany({
      where: { country_id, approval_status: 'APPROVED', is_active: true },
      select: { title: true, type: true, base_price: true },
      take: 15,
    }),
  ])

  if (!country) return NextResponse.json({ error: 'Country not found' }, { status: 404 })

  const styleGuide = {
    BUDGET:  'budget-friendly (hostels, local transport, street food, free attractions)',
    COMFORT: 'comfortable mid-range (3-star hotels, mix of transport, local restaurants)',
    LUXURY:  'luxury (5-star hotels, private transfers, fine dining, exclusive experiences)',
  }[travel_style]

  const prompt = `You are a world-class travel planner. Create a detailed ${duration_days}-day ${travel_style.toLowerCase()} trip itinerary for ${country.name}.

TRAVEL STYLE: ${styleGuide}

USER'S BUCKET LIST PLACES (prioritize these):
${bucketPlaces.map((p) => `- ${p.name} (${p.category.toLowerCase()}) in ${p.city || country.name}: ${p.description || 'no description'}`).join('\n') || 'None specified — choose the best places'}

OTHER NOTABLE PLACES IN ${country.name.toUpperCase()}:
${allPlaces.map((p) => `- ${p.name} (${p.category.toLowerCase()}) in ${p.city || country.name}`).join('\n') || 'None available'}

AVAILABLE PROVIDER LISTINGS (hotels & transport):
${listings.map((l) => `- ${l.title} (${l.type.toLowerCase()}) from $${Number(l.base_price)}/unit`).join('\n') || 'No listings yet'}

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "title": "string — creative trip title",
  "days": [
    {
      "day": 1,
      "title": "string — day theme",
      "notes": "string — brief overview",
      "legs": [
        {
          "type": "PLACE" | "TRANSPORT" | "ACCOMMODATION",
          "title": "string — place/transport/hotel name",
          "description": "string — what to do / why it's great",
          "duration_minutes": 120,
          "tip": "string — insider tip or practical advice"
        }
      ]
    }
  ]
}`

  let raw: any
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
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

  // Save plan to DB
  const plan = await prisma.tripPlan.create({
    data: {
      user_id:      session.user.id,
      country_id:   country.id,
      title:        raw.title ?? `${duration_days} days in ${country.name}`,
      duration_days,
      travel_style,
      raw_response: raw,
      days: {
        create: (raw.days as any[]).map((day: any) => ({
          day_number: day.day,
          title:      day.title ?? `Day ${day.day}`,
          notes:      day.notes ?? '',
          legs: {
            create: ((day.legs ?? []) as any[]).map((leg: any, i: number) => ({
              order:            i,
              type:             leg.type ?? 'PLACE',
              title:            leg.title ?? 'Activity',
              description:      leg.description ?? '',
              duration_minutes: leg.duration_minutes ?? null,
              tip:              leg.tip ?? null,
            })),
          },
        })),
      },
    },
  })

  return NextResponse.json({ plan_id: plan.id })
}
