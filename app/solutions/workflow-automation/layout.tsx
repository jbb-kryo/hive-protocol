import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflow Automation - AI-Powered Process Automation | HIVE',
  description: 'Automate complex workflows with AI agents. Visual workflow builder, intelligent triggers, 100+ integrations. Reduce manual work by 90%. Start free.',
  keywords: [
    'workflow automation',
    'AI automation',
    'process automation',
    'business automation',
    'workflow builder',
    'intelligent automation',
    'robotic process automation',
    'AI workflows',
  ],
  alternates: {
    canonical: '/solutions/workflow-automation',
  },
  openGraph: {
    title: 'Workflow Automation - AI-Powered Process Automation | HIVE',
    description: 'Automate complex workflows with AI agents. Visual builder, intelligent triggers, and seamless integrations.',
    type: 'website',
    url: '/solutions/workflow-automation',
  },
}

export default function WorkflowAutomationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
