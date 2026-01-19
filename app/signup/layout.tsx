import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Your Free Account | HIVE',
  description: 'Create your free HIVE account in seconds. No credit card required. Start building AI agent swarms with our generous free tier.',
  alternates: {
    canonical: '/signup',
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
