import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us - Get in Touch | HIVE',
  description: 'Questions about HIVE? Contact our team for sales inquiries, technical support, partnership opportunities, or general questions.',
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
