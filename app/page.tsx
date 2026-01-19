import type { Metadata } from 'next'
import { Navbar } from '@/components/marketing/navbar'
import { HeroSection } from '@/components/marketing/hero-section'
import { FeaturesSection } from '@/components/marketing/features-section'
import { IntegrationsSection } from '@/components/marketing/integrations-section'
import { PricingSection } from '@/components/marketing/pricing-section'
import { HomeFAQSection } from '@/components/marketing/home-faq-section'
import { CTASection } from '@/components/marketing/cta-section'
import { Footer } from '@/components/marketing/footer'
import { JsonLd } from '@/components/seo/json-ld'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <JsonLd
        data={[
          {
            type: 'Organization',
            name: 'HIVE',
            url: 'https://hive-protocol.online',
            logo: 'https://hive-protocol.online/logo.png',
            description: 'HIVE is an AI agent orchestration platform that enables teams to build, deploy, and manage autonomous AI agent swarms. Create multi-agent systems that collaborate to solve complex problems with human-in-the-loop controls.',
            foundingDate: '2024',
            email: 'hello@hive-protocol.online',
            sameAs: [
              'https://twitter.com/hiveprotocol',
              'https://linkedin.com/company/hive-protocol',
              'https://github.com/hive-protocol',
            ],
            contactPoint: {
              contactType: 'customer support',
              email: 'support@hive-protocol.online',
              availableLanguage: ['English'],
            },
          },
          {
            type: 'SoftwareApplication',
            name: 'HIVE',
            description: 'AI Agent Orchestration Platform for building and managing autonomous AI agent swarms with human-in-the-loop controls.',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            offers: {
              price: '0',
              priceCurrency: 'USD',
            },
          },
          {
            type: 'WebSite',
            name: 'HIVE',
            url: 'https://hive-protocol.online',
            description: 'AI Agent Orchestration Platform - Build, deploy, and manage autonomous AI agent swarms.',
            searchAction: {
              target: 'https://hive-protocol.online/search?q={search_term_string}',
              queryInput: 'required name=search_term_string',
            },
          },
        ]}
      />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <IntegrationsSection />
      <PricingSection />
      <HomeFAQSection />
      <CTASection />
      <Footer />
    </main>
  )
}
