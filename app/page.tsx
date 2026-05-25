import Header from '@/components/marketing/Header'
import Hero from '@/components/marketing/Hero'
import HowItWorks from '@/components/marketing/HowItWorks'
import SampleShowcase from '@/components/marketing/SampleShowcase'
import Pricing from '@/components/marketing/Pricing'
import BottomCTA from '@/components/marketing/BottomCTA'
import Footer from '@/components/marketing/Footer'
import { getShowcaseStories } from '@/lib/featured-stories'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { hero, samples } = await getShowcaseStories()
  return (
    <main className="bg-surface min-h-screen">
      <Header />
      <Hero hero={hero} />
      <HowItWorks />
      <SampleShowcase samples={samples} />
      <Pricing />
      <BottomCTA />
      <Footer />
    </main>
  )
}
