import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { CookieConsent } from '@/components/cookie-consent'
import { FeedbackWidget } from '@/components/feedback-widget'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hive-protocol.online'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AI Agent Orchestration Platform | HIVE',
    template: '%s',
  },
  description: 'Build and orchestrate AI agent swarms in real-time. Connect Claude, GPT-4, and local models to collaborate on complex tasks. Start free today.',
  keywords: ['AI agents', 'multi-agent', 'swarm intelligence', 'AI orchestration', 'Claude', 'GPT-4', 'AI platform'],
  authors: [{ name: 'HIVE' }],
  creator: 'HIVE',
  publisher: 'HIVE',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'HIVE',
    title: 'AI Agent Orchestration Platform | HIVE',
    description: 'Build and orchestrate AI agent swarms in real-time. Connect Claude, GPT-4, and local models to collaborate on complex tasks.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HIVE - AI Agent Orchestration Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Agent Orchestration Platform | HIVE',
    description: 'Build AI agent swarms in real-time. Connect Claude, GPT-4, and local models to collaborate on complex tasks.',
    images: ['/og-image.png'],
    creator: '@haborhive',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
          <CookieConsent />
          <FeedbackWidget />
        </ThemeProvider>
      </body>
    </html>
  )
}
