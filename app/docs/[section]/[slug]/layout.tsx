import type { Metadata } from 'next'
import { docsNavigation, getDocContent } from '@/lib/docs-content'
import { truncateTitle, truncateDescription } from '@/lib/seo'

interface Props {
  params: { section: string; slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const section = docsNavigation.find((s) => s.slug === params.section)
  const item = section?.items.find((i) => i.slug === params.slug)
  const content = getDocContent(params.slug)

  if (!section || !item) {
    return {
      title: 'Documentation | HIVE',
      alternates: {
        canonical: '/docs',
      },
    }
  }

  const rawDescription = content
    ? content.replace(/[#*`\n]/g, ' ').replace(/\s+/g, ' ').trim()
    : `Learn about ${item.title} in the HIVE documentation. Comprehensive guide with examples and best practices.`
  const description = truncateDescription(rawDescription)

  const pageTitle = truncateTitle(`${item.title} - ${section.title} | HIVE`)

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: `/docs/${params.section}/${params.slug}`,
    },
    openGraph: {
      title: pageTitle,
      description,
      siteName: 'HIVE',
      type: 'article',
    },
  }
}

export default function DocsPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
