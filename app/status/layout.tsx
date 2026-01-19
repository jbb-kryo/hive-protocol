import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Status | HIVE',
  description: 'Check real-time status of HIVE services. View uptime history, incident reports, and scheduled maintenance for all platform components.',
  alternates: {
    canonical: '/status',
  },
}

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
