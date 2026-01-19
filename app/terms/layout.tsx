import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | HIVE',
  description: 'Review the terms and conditions for using HIVE. Understand your rights and responsibilities as a user of our AI agent platform.',
  alternates: {
    canonical: '/terms',
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
