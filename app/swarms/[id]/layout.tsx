import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { createDynamicTitle, truncateDescription } from '@/lib/seo'

interface Props {
  params: { id: string }
  children: React.ReactNode
}

async function getSwarm(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data } = await supabase
    .from('swarms')
    .select('name, task, status, visibility')
    .eq('id', id)
    .maybeSingle()

  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.id.startsWith('demo')) {
    return {
      title: 'Demo Swarm | HIVE',
      description: 'Experience HIVE multi-agent collaboration with this interactive demo swarm.',
      robots: { index: false, follow: false },
    }
  }

  const swarm = await getSwarm(params.id)

  if (!swarm) {
    return {
      title: 'Swarm Not Found | HIVE',
      robots: { index: false, follow: false },
    }
  }

  if (swarm.visibility === 'private') {
    return {
      title: `${swarm.name} | HIVE`,
      robots: { index: false, follow: false },
    }
  }

  const pageTitle = createDynamicTitle(swarm.name, 'Swarm')
  const description = truncateDescription(
    swarm.task || `Collaborate with AI agents in the ${swarm.name} swarm on HIVE Protocol.`
  )

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: `/swarms/${params.id}`,
    },
    openGraph: {
      title: `${swarm.name} - Multi-Agent Swarm`,
      description,
      siteName: 'HIVE',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: swarm.name,
      description,
    },
  }
}

export default function SwarmLayout({ children }: Props) {
  return children
}
