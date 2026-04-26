import Header from '@/components/marketing/Header'
import Hero from '@/components/marketing/Hero'
import HowItWorks from '@/components/marketing/HowItWorks'
import SampleShowcase from '@/components/marketing/SampleShowcase'
import BottomCTA from '@/components/marketing/BottomCTA'
import Footer from '@/components/marketing/Footer'

export default function Home() {
  return (
    <main className="bg-surface min-h-screen">
      <Header />
      <Hero />
      <HowItWorks />
      <SampleShowcase />
      <BottomCTA />
      <Footer />
    </main>
  )
}
