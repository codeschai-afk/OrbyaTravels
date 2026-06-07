export const dynamic = 'force-dynamic'

import { Hero } from '@/components/home/Hero'
import { FeaturedCountries } from '@/components/home/FeaturedCountries'
import { HowItWorks } from '@/components/home/HowItWorks'

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCountries />
      <HowItWorks />
    </>
  )
}
