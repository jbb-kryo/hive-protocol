import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agent Marketplace - Pre-built AI | HIVE',
  description: 'Browse pre-built AI agents ready to deploy. Find specialized agents for research, coding, writing, analysis, and more.',
  alternates: {
    canonical: '/marketplace',
  },
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
