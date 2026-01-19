import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Agents News & Tutorials | HIVE',
  description: 'Stay updated with AI agent news, tutorials, and best practices. Learn how to build effective multi-agent systems with expert guides.',
  alternates: {
    canonical: '/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
