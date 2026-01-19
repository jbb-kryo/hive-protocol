import type { Metadata } from 'next'
import { Navbar } from '@/components/marketing/navbar'
import { PricingSection } from '@/components/marketing/pricing-section'
import { PricingFAQSection } from '@/components/marketing/pricing-faq-section'
import { CTASection } from '@/components/marketing/cta-section'
import { Footer } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Pricing Plans - Multi-Agent AI Platform | HIVE Protocol',
  description: 'Transparent pricing for AI agent orchestration. Start free with generous limits. Scale your multi-agent swarms seamlessly as your team and usage grows.',
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-24">
        <div className="text-center py-12 px-4">
          <h1 className="text-4xl sm:text-5xl font-bold">Multi-Agent AI Platform Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Transparent, usage-based pricing for AI agent orchestration. Start building autonomous
            multi-agent swarms for free with generous limits, then scale seamlessly as your needs grow.
            No hidden fees, no surprise charges.
          </p>
        </div>
        <PricingSection />
        <PricingFAQSection />
        <CTASection />
      </div>
      <Footer />
    </main>
  )
}
