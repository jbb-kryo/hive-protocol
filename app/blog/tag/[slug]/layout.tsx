import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const formattedTag = params.slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    title: `${formattedTag} Articles | HIVE Protocol Blog`,
    description: `Browse all articles tagged with "${formattedTag}" on the HIVE Protocol blog. Learn about AI agents, swarm intelligence, and more.`,
    openGraph: {
      title: `${formattedTag} Articles | HIVE Protocol Blog`,
      description: `Browse all articles tagged with "${formattedTag}" on the HIVE Protocol blog.`,
      type: 'website',
    },
  }
}

export default function BlogTagLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
