import type { Metadata } from 'next'
import { DocsClientLayout } from './docs-client-layout'

export const metadata: Metadata = {
  title: 'Documentation | HIVE Protocol',
  description: 'Comprehensive HIVE Protocol documentation. Learn to build AI agent swarms, configure models, integrate APIs, and deploy secure multi-agent systems.',
  keywords: ['AI agents', 'documentation', 'API reference', 'swarm intelligence', 'multi-agent systems', 'HIVE Protocol'],
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    title: 'Documentation | HIVE Protocol',
    description: 'Comprehensive HIVE Protocol documentation for AI agent orchestration.',
    type: 'website',
  },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsClientLayout>{children}</DocsClientLayout>
}
