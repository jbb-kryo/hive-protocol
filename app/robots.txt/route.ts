const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hiveprotocol.ai'

export async function GET() {
  const robotsTxt = `# HIVE Protocol - Robots.txt
# https://www.robotstxt.org/

# Allow all search engine bots
User-agent: *

# Public pages - allowed
Allow: /
Allow: /features
Allow: /pricing
Allow: /about
Allow: /contact
Allow: /blog
Allow: /blog/*
Allow: /docs
Allow: /docs/*
Allow: /changelog
Allow: /marketplace
Allow: /marketplace/*
Allow: /community
Allow: /careers
Allow: /status
Allow: /security
Allow: /privacy
Allow: /terms

# Static assets - allowed
Allow: /_next/static/
Allow: /images/
Allow: /icons/

# Authentication pages - allowed for discoverability
Allow: /login
Allow: /signup

# Authenticated/private areas - blocked
Disallow: /admin
Disallow: /admin/*
Disallow: /dashboard
Disallow: /dashboard/*
Disallow: /settings
Disallow: /settings/*
Disallow: /agents
Disallow: /agents/*
Disallow: /swarms
Disallow: /swarms/*
Disallow: /tools
Disallow: /tools/*
Disallow: /workflows
Disallow: /workflows/*
Disallow: /teams
Disallow: /teams/*
Disallow: /integrations
Disallow: /integrations/*
Disallow: /onboarding

# Auth flow pages - blocked
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /verify-email
Disallow: /resend-verification

# API routes - blocked
Disallow: /api/
Disallow: /api/*

# Next.js internals - blocked
Disallow: /_next/data/

# Sitemap location
Sitemap: ${SITE_URL}/sitemap.xml

# Crawl-delay for respectful crawling (optional, in seconds)
# Most modern crawlers ignore this, but it's good practice
Crawl-delay: 1
`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
