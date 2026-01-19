import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Agent Tools & Capabilities | HIVE',
  description: 'Discover HIVE features: multi-agent orchestration, real-time collaboration, cryptographic verification, and human-in-the-loop controls.',
  alternates: {
    canonical: '/features',
  },
}

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
