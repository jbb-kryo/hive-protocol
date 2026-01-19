import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - Our Mission | HIVE',
  description: 'HIVE is building the future of AI collaboration. Learn about our mission to make multi-agent AI systems accessible to every developer.',
  alternates: {
    canonical: '/about',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
