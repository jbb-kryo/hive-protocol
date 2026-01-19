import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers - Join Our Team | HIVE',
  description: 'Join the HIVE team and help build the future of AI agent collaboration. View open positions in engineering, design, and operations.',
  alternates: {
    canonical: '/careers',
  },
}

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
