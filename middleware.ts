import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const redirects: Record<string, { destination: string; permanent: boolean }> = {
  '/documentation': { destination: '/docs', permanent: true },
  '/api-docs': { destination: '/docs/api/reference', permanent: true },
  '/api-reference': { destination: '/docs/api/reference', permanent: true },
  '/getting-started': { destination: '/docs/getting-started/quick-start', permanent: true },
  '/quickstart': { destination: '/docs/getting-started/quick-start', permanent: true },
  '/quick-start': { destination: '/docs/getting-started/quick-start', permanent: true },
  '/guide': { destination: '/docs', permanent: true },
  '/guides': { destination: '/docs', permanent: true },
  '/faq': { destination: '/docs', permanent: true },
  '/help': { destination: '/docs', permanent: true },
  '/support': { destination: '/contact', permanent: true },
  '/register': { destination: '/signup', permanent: true },
  '/sign-up': { destination: '/signup', permanent: true },
  '/sign-in': { destination: '/login', permanent: true },
  '/signin': { destination: '/login', permanent: true },
  '/log-in': { destination: '/login', permanent: true },
  '/account': { destination: '/settings', permanent: true },
  '/profile': { destination: '/settings', permanent: true },
  '/preferences': { destination: '/settings', permanent: true },
  '/my-account': { destination: '/settings', permanent: true },
  '/bots': { destination: '/agents', permanent: true },
  '/ai-agents': { destination: '/agents', permanent: true },
  '/assistants': { destination: '/agents', permanent: true },
  '/store': { destination: '/marketplace', permanent: true },
  '/shop': { destination: '/marketplace', permanent: true },
  '/plugins': { destination: '/marketplace', permanent: true },
  '/extensions': { destination: '/marketplace', permanent: true },
  '/plans': { destination: '/pricing', permanent: true },
  '/prices': { destination: '/pricing', permanent: true },
  '/subscribe': { destination: '/pricing', permanent: true },
  '/news': { destination: '/blog', permanent: true },
  '/articles': { destination: '/blog', permanent: true },
  '/posts': { destination: '/blog', permanent: true },
  '/updates': { destination: '/changelog', permanent: true },
  '/release-notes': { destination: '/changelog', permanent: true },
  '/releases': { destination: '/changelog', permanent: true },
  '/whats-new': { destination: '/changelog', permanent: true },
  '/jobs': { destination: '/careers', permanent: true },
  '/hiring': { destination: '/careers', permanent: true },
  '/work-with-us': { destination: '/careers', permanent: true },
  '/company': { destination: '/about', permanent: true },
  '/about-us': { destination: '/about', permanent: true },
  '/team': { destination: '/about', permanent: true },
  '/tos': { destination: '/terms', permanent: true },
  '/terms-of-service': { destination: '/terms', permanent: true },
  '/legal': { destination: '/terms', permanent: true },
  '/privacy-policy': { destination: '/privacy', permanent: true },
  '/app': { destination: '/dashboard', permanent: true },
  '/home': { destination: '/dashboard', permanent: true },
  '/console': { destination: '/dashboard', permanent: true },
  '/automations': { destination: '/workflows', permanent: true },
  '/automation': { destination: '/workflows', permanent: true },
  '/pipelines': { destination: '/workflows', permanent: true },
}

const gonePages = new Set([
  '/legacy-api',
  '/v1-docs',
  '/old-dashboard',
  '/deprecated',
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.endsWith('/rss.xml')
  ) {
    return NextResponse.next()
  }

  let normalizedPathname = pathname

  if (pathname !== pathname.toLowerCase()) {
    normalizedPathname = pathname.toLowerCase()
  }

  if (normalizedPathname.length > 1 && normalizedPathname.endsWith('/')) {
    normalizedPathname = normalizedPathname.slice(0, -1)
  }

  if (gonePages.has(normalizedPathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/gone'
    const response = NextResponse.rewrite(url)
    response.headers.set('X-Robots-Tag', 'noindex')
    return response
  }

  const redirect = redirects[normalizedPathname]
  if (redirect) {
    const url = request.nextUrl.clone()
    url.pathname = redirect.destination
    return NextResponse.redirect(url, redirect.permanent ? 301 : 302)
  }

  if (normalizedPathname !== pathname) {
    const url = request.nextUrl.clone()
    url.pathname = normalizedPathname
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
