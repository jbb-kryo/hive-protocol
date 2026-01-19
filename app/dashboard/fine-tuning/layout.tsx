import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fine-tuning Studio | HIVE',
  description: 'Create and manage custom AI models trained on your conversation data.',
}

export default function FineTuningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
