import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Agent Platform - Build & Deploy Intelligent Agents | HIVE',
  description: 'Enterprise AI agent platform for building, deploying, and managing intelligent agents. Connect to GPT-4, Claude, Gemini. Start free with no credit card.',
  keywords: [
    'AI agent platform',
    'intelligent agents',
    'AI automation',
    'GPT-4 agents',
    'Claude AI',
    'agent builder',
    'AI development platform',
    'conversational AI',
  ],
  alternates: {
    canonical: '/solutions/ai-agent-platform',
  },
  openGraph: {
    title: 'AI Agent Platform - Build & Deploy Intelligent Agents | HIVE',
    description: 'Enterprise AI agent platform for building, deploying, and managing intelligent agents at scale.',
    type: 'website',
    url: '/solutions/ai-agent-platform',
  },
}

export default function AIAgentPlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
