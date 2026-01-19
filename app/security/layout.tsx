import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security - Trust & Compliance | HIVE',
  description: 'Enterprise-grade security for your AI agents. Learn about our encryption, compliance certifications, and data protection practices.',
  alternates: {
    canonical: '/security',
  },
}

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
