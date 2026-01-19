import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Development Tools - SDKs, APIs & CLI | HIVE',
  description: 'Developer tools for building AI agents. REST APIs, TypeScript/Python SDKs, CLI tools, testing framework. Full documentation and examples.',
  keywords: [
    'AI SDK',
    'AI API',
    'agent development',
    'TypeScript SDK',
    'Python SDK',
    'AI developer tools',
    'LLM API',
    'AI CLI',
  ],
  alternates: {
    canonical: '/solutions/ai-development-tools',
  },
  openGraph: {
    title: 'AI Development Tools - SDKs, APIs & CLI | HIVE',
    description: 'Developer tools for building AI agent applications. SDKs, APIs, CLI, and testing framework.',
    type: 'website',
    url: '/solutions/ai-development-tools',
  },
}

export default function AIDevelopmentToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
