import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hiveprotocol.ai'
const BRAND_NAME = 'HIVE'
const MAX_TITLE_LENGTH = 60
const MAX_DESCRIPTION_LENGTH = 160
const MIN_DESCRIPTION_LENGTH = 150

export function getCanonicalUrl(path: string): string {
  let cleanPath = path.split('?')[0].split('#')[0]

  cleanPath = cleanPath.replace(/\/+$/, '')

  if (cleanPath === '') {
    return SITE_URL
  }

  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath
  }

  return `${SITE_URL}${cleanPath}`
}

export function truncateTitle(title: string, maxLength: number = MAX_TITLE_LENGTH): string {
  if (title.length <= maxLength) return title
  return title.substring(0, maxLength - 3).trim() + '...'
}

export function truncateDescription(description: string, maxLength: number = MAX_DESCRIPTION_LENGTH): string {
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength - 3).trim() + '...'
}

export function createDynamicDescription(
  itemName: string,
  template: string,
  maxLength: number = MAX_DESCRIPTION_LENGTH
): string {
  const description = template.replace('{name}', itemName)
  return truncateDescription(description, maxLength)
}

export function createPageTitle(primaryText: string, includeBrand: boolean = true): string {
  if (!includeBrand) return truncateTitle(primaryText)
  const fullTitle = `${primaryText} | ${BRAND_NAME}`
  return truncateTitle(fullTitle)
}

export function createDynamicTitle(
  itemName: string,
  category: string,
  maxItemLength: number = 35
): string {
  const truncatedItem = itemName.length > maxItemLength
    ? itemName.substring(0, maxItemLength - 3).trim() + '...'
    : itemName
  return truncateTitle(`${truncatedItem} - ${category} | ${BRAND_NAME}`)
}

export function generatePageMetadata({
  title,
  description,
  path,
  noIndex = false,
  openGraphImage,
  keywords,
}: {
  title: string
  description: string
  path: string
  noIndex?: boolean
  openGraphImage?: string
  keywords?: string[]
}): Metadata {
  const canonicalUrl = getCanonicalUrl(path)
  const fullTitle = truncateTitle(title)

  return {
    title: fullTitle,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: 'HIVE',
      type: 'website',
      images: openGraphImage ? [{ url: openGraphImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: openGraphImage ? [openGraphImage] : undefined,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  }
}

export function generateArticleMetadata({
  title,
  description,
  path,
  publishedTime,
  modifiedTime,
  authors,
  tags,
  openGraphImage,
}: {
  title: string
  description: string
  path: string
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  tags?: string[]
  openGraphImage?: string
}): Metadata {
  const canonicalUrl = getCanonicalUrl(path)
  const fullTitle = createDynamicTitle(title, 'Blog')

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: 'HIVE',
      type: 'article',
      publishedTime,
      modifiedTime,
      authors,
      tags,
      images: openGraphImage ? [{ url: openGraphImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: openGraphImage ? [openGraphImage] : undefined,
    },
  }
}

export const pageTitles = {
  home: 'AI Agent Orchestration Platform | HIVE',
  features: 'AI Agent Tools & Capabilities | HIVE',
  pricing: 'Pricing Plans - Start Free | HIVE',
  blog: 'AI Agents News & Tutorials | HIVE',
  docs: 'Documentation - Getting Started | HIVE',
  about: 'About Us - Our Mission | HIVE',
  contact: 'Contact Us - Get in Touch | HIVE',
  careers: 'Careers - Join Our Team | HIVE',
  changelog: 'Changelog - Product Updates | HIVE',
  community: 'Community - Join the Discussion | HIVE',
  integrations: 'Integrations - Connect Your Tools | HIVE',
  marketplace: 'Agent Marketplace - Pre-built AI | HIVE',
  security: 'Security - Trust & Compliance | HIVE',
  privacy: 'Privacy Policy | HIVE',
  terms: 'Terms of Service | HIVE',
  status: 'System Status | HIVE',
  login: 'Sign In to Your Account | HIVE',
  signup: 'Create Your Free Account | HIVE',
  dashboard: 'Dashboard | HIVE',
  agents: 'AI Agents - Manage & Configure | HIVE',
  swarms: 'Swarms - Multi-Agent Sessions | HIVE',
  tools: 'Tools - Custom Capabilities | HIVE',
  workflows: 'Workflows - Automate Tasks | HIVE',
  settings: 'Settings - Account & Preferences | HIVE',
  teams: 'Teams - Collaborate Together | HIVE',
  admin: 'Admin Dashboard | HIVE',
  forgotPassword: 'Reset Your Password | HIVE',
  resetPassword: 'Set New Password | HIVE',
  verifyEmail: 'Verify Your Email | HIVE',
  onboarding: 'Get Started with HIVE',
}

export const pageDescriptions = {
  home: 'Build and orchestrate AI agent swarms in real-time. Connect Claude, GPT-4, and local models to collaborate on complex tasks. Start free today.',
  features: 'Discover HIVE features: multi-agent orchestration, real-time collaboration, cryptographic verification, and human-in-the-loop controls.',
  pricing: 'Simple, transparent pricing for AI agent orchestration. Start free with generous limits. Scale seamlessly as your team and usage grows.',
  blog: 'Stay updated with AI agent news, tutorials, and best practices. Learn how to build effective multi-agent systems with expert guides.',
  docs: 'Get started with HIVE in minutes. Comprehensive guides for AI agent configuration, swarm management, API integration, and advanced features.',
  about: 'HIVE is building the future of AI collaboration. Learn about our mission to make multi-agent AI systems accessible to every developer.',
  contact: 'Questions about HIVE? Contact our team for sales inquiries, technical support, partnership opportunities, or general questions.',
  careers: 'Join the HIVE team and help build the future of AI agent collaboration. View open positions in engineering, design, and operations.',
  changelog: 'See what\'s new in HIVE. Browse our changelog for the latest features, improvements, bug fixes, and platform updates.',
  community: 'Connect with HIVE developers worldwide. Share projects, get help, discuss best practices, and contribute to the AI agent ecosystem.',
  integrations: 'Connect HIVE with your favorite tools. Integrate with Slack, GitHub, Notion, and more. Build custom integrations with our API.',
  marketplace: 'Browse pre-built AI agents ready to deploy. Find specialized agents for research, coding, writing, analysis, and more.',
  security: 'Enterprise-grade security for your AI agents. Learn about our encryption, compliance certifications, and data protection practices.',
  privacy: 'Your privacy matters. Read how HIVE collects, uses, and protects your personal information in compliance with global standards.',
  terms: 'Review the terms and conditions for using HIVE. Understand your rights and responsibilities as a user of our AI agent platform.',
  status: 'Check real-time status of HIVE services. View uptime history, incident reports, and scheduled maintenance for all platform components.',
  login: 'Sign in to access your HIVE dashboard. Manage AI agents, view swarm activity, and configure your multi-agent workflows.',
  signup: 'Create your free HIVE account in seconds. No credit card required. Start building AI agent swarms with our generous free tier.',
}

export const siteMetadata = {
  siteUrl: SITE_URL,
  siteName: 'HIVE',
  defaultTitle: pageTitles.home,
  defaultDescription: pageDescriptions.home,
  defaultImage: `${SITE_URL}/og-image.png`,
}
