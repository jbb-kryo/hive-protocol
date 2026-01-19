import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Performance Analytics | HIVE',
  description: 'Track agent performance, conversation metrics, and cost analysis for your AI agents.',
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
