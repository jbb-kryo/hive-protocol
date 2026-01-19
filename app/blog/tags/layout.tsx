import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog Tags | HIVE Protocol',
  description: 'Browse all blog tags and topics. Find articles about AI agents, swarm intelligence, tutorials, and more on the HIVE Protocol blog.',
  openGraph: {
    title: 'Blog Tags | HIVE Protocol',
    description: 'Browse all blog tags and topics on the HIVE Protocol blog.',
    type: 'website',
  },
}

export default function BlogTagsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
