export const dynamic = 'force-dynamic'

import { prisma } from '@orbyatravel/db'
import { Hero } from '@/components/home/Hero'
import { Features } from '@/components/home/Features'
import { FeaturedCountries } from '@/components/home/FeaturedCountries'
import { HowItWorks } from '@/components/home/HowItWorks'

export default async function HomePage() {
  const destinationCount = await prisma.country.count({ where: { is_active: true } })

  return (
    <>
      <Hero destinationCount={destinationCount} />
      <Features />
      <FeaturedCountries />
      <HowItWorks />
    </>
  )
}
