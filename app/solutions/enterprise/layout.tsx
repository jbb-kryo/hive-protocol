import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Enterprise AI Solutions - Security, Compliance & Scale | HIVE',
  description: 'Enterprise-grade AI agent platform with SOC 2, GDPR compliance, SSO, dedicated infrastructure, and 24/7 support. Built for Fortune 500 companies.',
  keywords: [
    'enterprise AI',
    'enterprise chatbot',
    'SOC 2 AI',
    'GDPR compliant AI',
    'enterprise automation',
    'AI security',
    'dedicated AI infrastructure',
    'enterprise AI platform',
  ],
  alternates: {
    canonical: '/solutions/enterprise',
  },
  openGraph: {
    title: 'Enterprise AI Solutions - Security, Compliance & Scale | HIVE',
    description: 'Enterprise-grade AI agent platform with advanced security, compliance certifications, and dedicated support.',
    type: 'website',
    url: '/solutions/enterprise',
  },
}

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
