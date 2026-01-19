import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog - Product Updates | HIVE',
  description: 'See what\'s new in HIVE. Browse our changelog for the latest features, improvements, bug fixes, and platform updates.',
  alternates: {
    canonical: '/changelog',
  },
}

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
