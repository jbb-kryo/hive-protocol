import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | HIVE',
  description: 'Your privacy matters. Read how HIVE collects, uses, and protects your personal information in compliance with global standards.',
  alternates: {
    canonical: '/privacy',
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
