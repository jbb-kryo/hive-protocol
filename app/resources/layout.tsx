import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Agent Development Resources & Guides | HIVE',
  description: 'Learn to build AI agents with our comprehensive guides, tutorials, and reference materials. From beginner basics to advanced multi-agent systems.',
  keywords: [
    'AI agent tutorial',
    'build AI agents',
    'multi-agent systems guide',
    'LLM development',
    'AI automation guide',
    'prompt engineering tutorial',
    'AI agent best practices',
  ],
  alternates: {
    canonical: '/resources',
  },
  openGraph: {
    title: 'AI Agent Development Resources | HIVE',
    description: 'Guides, tutorials, and reference materials for building AI agent systems.',
    type: 'website',
    url: '/resources',
  },
}

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
