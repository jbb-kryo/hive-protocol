import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Multi-Agent Collaboration - AI Agents Working Together | HIVE',
  description: 'Orchestrate multiple AI agents to collaborate on complex tasks. Human-in-the-loop controls, swarm intelligence, and specialized agent teams. Try free.',
  keywords: [
    'multi-agent AI',
    'AI collaboration',
    'swarm intelligence',
    'agent orchestration',
    'human-in-the-loop',
    'AI teams',
    'collaborative AI',
    'agent coordination',
  ],
  alternates: {
    canonical: '/solutions/multi-agent-collaboration',
  },
  openGraph: {
    title: 'Multi-Agent Collaboration - AI Agents Working Together | HIVE',
    description: 'Orchestrate multiple AI agents to collaborate on complex tasks with human oversight and control.',
    type: 'website',
    url: '/solutions/multi-agent-collaboration',
  },
}

export default function MultiAgentCollaborationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
