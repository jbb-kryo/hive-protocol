import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const categoryMeta: Record<string, { title: string; description: string }> = {
    blog: {
      title: 'AI Agent Blog | HIVE Protocol Insights',
      description: 'Read the latest insights on AI agents, swarm intelligence, and multi-agent orchestration from the HIVE Protocol team.',
    },
    changelog: {
      title: 'Changelog | HIVE Protocol Updates',
      description: 'Stay up to date with the latest HIVE Protocol features, improvements, and bug fixes.',
    },
    announcement: {
      title: 'Announcements | HIVE Protocol News',
      description: 'Important announcements and news from the HIVE Protocol team.',
    },
    tutorial: {
      title: 'Tutorials | HIVE Protocol Guides',
      description: 'Learn how to build AI agent swarms with our comprehensive tutorials and guides.',
    },
  }

  const meta = categoryMeta[params.slug] || {
    title: `${params.slug.charAt(0).toUpperCase() + params.slug.slice(1)} | HIVE Protocol Blog`,
    description: `Browse ${params.slug} posts on the HIVE Protocol blog.`,
  }

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
    },
  }
}

export default function BlogCategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
