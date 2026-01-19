import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const formattedName = params.slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    title: `${formattedName} | HIVE Protocol Blog Author`,
    description: `Read articles by ${formattedName} on the HIVE Protocol blog. Insights on AI agents, swarm intelligence, and multi-agent orchestration.`,
    openGraph: {
      title: `${formattedName} | HIVE Protocol Blog Author`,
      description: `Read articles by ${formattedName} on the HIVE Protocol blog.`,
      type: 'profile',
    },
  }
}

export default function BlogAuthorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
