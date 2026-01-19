import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog Authors | HIVE Protocol',
  description: 'Meet the authors behind the HIVE Protocol blog. Read insights from our team on AI agents, swarm intelligence, and multi-agent orchestration.',
  openGraph: {
    title: 'Blog Authors | HIVE Protocol',
    description: 'Meet the authors behind the HIVE Protocol blog.',
    type: 'website',
  },
}

export default function BlogAuthorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
