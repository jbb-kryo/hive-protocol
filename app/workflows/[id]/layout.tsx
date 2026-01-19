import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { createDynamicTitle, truncateDescription } from '@/lib/seo'

interface Props {
  params: { id: string }
  children: React.ReactNode
}

async function getWorkflow(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data } = await supabase
    .from('workflows')
    .select('name, description, status, trigger_type')
    .eq('id', id)
    .maybeSingle()

  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const workflow = await getWorkflow(params.id)

  if (!workflow) {
    return {
      title: 'Workflow Not Found | HIVE',
      robots: { index: false, follow: false },
    }
  }

  const pageTitle = createDynamicTitle(workflow.name, 'Workflow')
  const description = truncateDescription(
    workflow.description || `Automate tasks with the ${workflow.name} workflow on HIVE Protocol.`
  )

  return {
    title: pageTitle,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${workflow.name} - Automation Workflow`,
      description,
      siteName: 'HIVE',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: workflow.name,
      description,
    },
  }
}

export default function WorkflowLayout({ children }: Props) {
  return children
}
