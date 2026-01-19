import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community - Join the Discussion | HIVE',
  description: 'Connect with HIVE developers worldwide. Share projects, get help, discuss best practices, and contribute to the AI agent ecosystem.',
  alternates: {
    canonical: '/community',
  },
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
