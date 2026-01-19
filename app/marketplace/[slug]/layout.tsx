import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { createDynamicTitle, truncateTitle, truncateDescription } from '@/lib/seo'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: agent } = await supabase
    .from('marketplace_agents')
    .select('name, description, category, icon_url')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!agent) {
    return {
      title: 'Agent Not Found | HIVE',
      alternates: {
        canonical: '/marketplace',
      },
    }
  }

  const pageTitle = createDynamicTitle(agent.name, 'Marketplace')
  const description = truncateDescription(
    agent.description || `Deploy ${agent.name} from the HIVE marketplace. Pre-built AI agent ready to integrate with your swarms.`
  )

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: `/marketplace/${params.slug}`,
    },
    openGraph: {
      title: truncateTitle(`${agent.name} - HIVE Marketplace`),
      description,
      siteName: 'HIVE',
      images: agent.icon_url ? [{ url: agent.icon_url }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: truncateTitle(agent.name),
      description,
      images: agent.icon_url ? [agent.icon_url] : undefined,
    },
  }
}

export default function MarketplaceAgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
