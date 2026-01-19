import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | HIVE',
  description: 'Find answers to common questions about HIVE AI agents, pricing, security, integrations, and more. Get started with AI agent automation today.',
  keywords: [
    'HIVE FAQ',
    'AI agent questions',
    'AI chatbot FAQ',
    'HIVE pricing',
    'AI agent security',
    'how to create AI agent',
    'multi-agent AI',
    'AI automation FAQ',
  ],
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'FAQ - Frequently Asked Questions | HIVE',
    description: 'Find answers to common questions about HIVE AI agents, pricing, security, and integrations.',
    type: 'website',
    url: '/faq',
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
