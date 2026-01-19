export interface RedirectRule {
  source: string
  destination: string
  permanent: boolean
}

export const redirects: RedirectRule[] = [
  { source: '/documentation', destination: '/docs', permanent: true },
  { source: '/api-docs', destination: '/docs/api/reference', permanent: true },
  { source: '/api-reference', destination: '/docs/api/reference', permanent: true },
  { source: '/getting-started', destination: '/docs/getting-started/quick-start', permanent: true },
  { source: '/quickstart', destination: '/docs/getting-started/quick-start', permanent: true },
  { source: '/quick-start', destination: '/docs/getting-started/quick-start', permanent: true },
  { source: '/guide', destination: '/docs', permanent: true },
  { source: '/guides', destination: '/docs', permanent: true },
  { source: '/faq', destination: '/docs', permanent: true },
  { source: '/help', destination: '/docs', permanent: true },
  { source: '/support', destination: '/contact', permanent: true },

  { source: '/register', destination: '/signup', permanent: true },
  { source: '/sign-up', destination: '/signup', permanent: true },
  { source: '/sign-in', destination: '/login', permanent: true },
  { source: '/signin', destination: '/login', permanent: true },
  { source: '/log-in', destination: '/login', permanent: true },

  { source: '/account', destination: '/settings', permanent: true },
  { source: '/profile', destination: '/settings', permanent: true },
  { source: '/preferences', destination: '/settings', permanent: true },
  { source: '/my-account', destination: '/settings', permanent: true },

  { source: '/bots', destination: '/agents', permanent: true },
  { source: '/ai-agents', destination: '/agents', permanent: true },
  { source: '/assistants', destination: '/agents', permanent: true },
  { source: '/autonomous-agents', destination: '/agents', permanent: true },
  { source: '/llm-agents', destination: '/agents', permanent: true },

  { source: '/store', destination: '/marketplace', permanent: true },
  { source: '/shop', destination: '/marketplace', permanent: true },
  { source: '/plugins', destination: '/marketplace', permanent: true },
  { source: '/extensions', destination: '/marketplace', permanent: true },
  { source: '/agent-marketplace', destination: '/marketplace', permanent: true },
  { source: '/agent-store', destination: '/marketplace', permanent: true },

  { source: '/plans', destination: '/pricing', permanent: true },
  { source: '/prices', destination: '/pricing', permanent: true },
  { source: '/subscribe', destination: '/pricing', permanent: true },
  { source: '/ai-pricing', destination: '/pricing', permanent: true },

  { source: '/ai-agent-features', destination: '/features', permanent: true },
  { source: '/platform-features', destination: '/features', permanent: true },
  { source: '/capabilities', destination: '/features', permanent: true },
  { source: '/multi-agent', destination: '/features', permanent: true },
  { source: '/orchestration', destination: '/features', permanent: true },

  { source: '/ai-swarms', destination: '/swarms', permanent: true },
  { source: '/agent-swarms', destination: '/swarms', permanent: true },
  { source: '/multi-agent-swarms', destination: '/swarms', permanent: true },

  { source: '/ai-tools', destination: '/tools', permanent: true },
  { source: '/agent-tools', destination: '/tools', permanent: true },

  { source: '/ai-workflows', destination: '/workflows', permanent: true },
  { source: '/agent-workflows', destination: '/workflows', permanent: true },

  { source: '/connections', destination: '/integrations', permanent: true },
  { source: '/llm-integrations', destination: '/integrations', permanent: true },
  { source: '/ai-integrations', destination: '/integrations', permanent: true },

  { source: '/news', destination: '/blog', permanent: true },
  { source: '/articles', destination: '/blog', permanent: true },
  { source: '/posts', destination: '/blog', permanent: true },
  { source: '/updates', destination: '/changelog', permanent: true },
  { source: '/release-notes', destination: '/changelog', permanent: true },
  { source: '/releases', destination: '/changelog', permanent: true },
  { source: '/whats-new', destination: '/changelog', permanent: true },

  { source: '/jobs', destination: '/careers', permanent: true },
  { source: '/hiring', destination: '/careers', permanent: true },
  { source: '/work-with-us', destination: '/careers', permanent: true },

  { source: '/company', destination: '/about', permanent: true },
  { source: '/about-us', destination: '/about', permanent: true },
  { source: '/team', destination: '/about', permanent: true },

  { source: '/tos', destination: '/terms', permanent: true },
  { source: '/terms-of-service', destination: '/terms', permanent: true },
  { source: '/legal', destination: '/terms', permanent: true },
  { source: '/privacy-policy', destination: '/privacy', permanent: true },

  { source: '/app', destination: '/dashboard', permanent: true },
  { source: '/home', destination: '/dashboard', permanent: true },
  { source: '/console', destination: '/dashboard', permanent: true },

  { source: '/automations', destination: '/workflows', permanent: true },
  { source: '/automation', destination: '/workflows', permanent: true },
  { source: '/pipelines', destination: '/workflows', permanent: true },
]

export const gonePages: string[] = [
  '/legacy-api',
  '/v1-docs',
  '/old-dashboard',
  '/deprecated',
]

export function findRedirect(pathname: string): RedirectRule | null {
  const normalizedPath = pathname.toLowerCase()
  return redirects.find(r => r.source === normalizedPath) || null
}

export function isGonePage(pathname: string): boolean {
  const normalizedPath = pathname.toLowerCase()
  return gonePages.includes(normalizedPath)
}
