import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In to Your Account | HIVE',
  description: 'Sign in to access your HIVE dashboard. Manage AI agents, view swarm activity, and configure your multi-agent workflows.',
  alternates: {
    canonical: '/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
