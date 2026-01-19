import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Glossary - Artificial Intelligence & Machine Learning Terms | HIVE',
  description: 'Comprehensive glossary of AI and machine learning terminology. Learn about LLMs, neural networks, AI agents, transformers, embeddings, and more AI concepts.',
  keywords: [
    'AI glossary',
    'machine learning terms',
    'artificial intelligence dictionary',
    'LLM terminology',
    'AI agent definitions',
    'neural network glossary',
    'NLP terms',
    'deep learning vocabulary',
  ],
  alternates: {
    canonical: '/glossary',
  },
  openGraph: {
    title: 'AI Glossary - AI & ML Terminology | HIVE',
    description: 'Learn AI and machine learning concepts with our comprehensive glossary of terms.',
    type: 'website',
    url: '/glossary',
  },
}

export default function GlossaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
