'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
}

const BASE_URL = 'https://hive-protocol.online'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  agents: 'Agents',
  swarms: 'Swarms',
  workflows: 'Workflows',
  tools: 'Tools',
  integrations: 'Integrations',
  marketplace: 'Marketplace',
  settings: 'Settings',
  admin: 'Admin',
  blog: 'Blog',
  docs: 'Documentation',
  about: 'About',
  pricing: 'Pricing',
  features: 'Features',
  contact: 'Contact',
  careers: 'Careers',
  changelog: 'Changelog',
  community: 'Community',
  status: 'System Status',
  security: 'Security',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  teams: 'Teams',
  login: 'Sign In',
  signup: 'Sign Up',
  'forgot-password': 'Forgot Password',
  'reset-password': 'Reset Password',
  'verify-email': 'Verify Email',
  onboarding: 'Onboarding',
  usage: 'Usage',
  compare: 'Compare Agents',
  templates: 'Templates',
  analytics: 'Analytics',
  users: 'Users',
  errors: 'Errors',
  'rate-limits': 'Rate Limits',
  ai: 'AI Models',
  creator: 'Creator Dashboard',
  create: 'Create',
  members: 'Members',
  billing: 'Billing',
}

function formatSegment(segment: string): string {
  if (routeLabels[segment]) return routeLabels[segment]
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface BreadcrumbsProps {
  customItems?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ customItems, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()

  if (pathname === '/') return null

  const segments = pathname.split('/').filter(Boolean)

  const items: BreadcrumbItem[] = customItems || segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    return {
      label: formatSegment(segment),
      href,
    }
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
        item: `${BASE_URL}${item.href}`,
      })),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className={`flex items-center text-sm ${className}`}>
        <ol className="flex items-center flex-wrap gap-1">
          <li className="flex items-center">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
              {index === items.length - 1 ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
