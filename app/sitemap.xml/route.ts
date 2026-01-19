import { createClient } from '@supabase/supabase-js'
import { docsNavigation } from '@/lib/docs-content'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hiveprotocol.ai'

interface SitemapEntry {
  url: string
  lastmod?: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

const staticPages: SitemapEntry[] = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/features', changefreq: 'weekly', priority: 0.9 },
  { url: '/pricing', changefreq: 'weekly', priority: 0.9 },
  { url: '/about', changefreq: 'monthly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog', changefreq: 'daily', priority: 0.8 },
  { url: '/docs', changefreq: 'weekly', priority: 0.8 },
  { url: '/changelog', changefreq: 'weekly', priority: 0.7 },
  { url: '/marketplace', changefreq: 'daily', priority: 0.8 },
  { url: '/community', changefreq: 'weekly', priority: 0.6 },
  { url: '/careers', changefreq: 'weekly', priority: 0.5 },
  { url: '/status', changefreq: 'hourly', priority: 0.5 },
  { url: '/security', changefreq: 'monthly', priority: 0.6 },
  { url: '/privacy', changefreq: 'monthly', priority: 0.4 },
  { url: '/terms', changefreq: 'monthly', priority: 0.4 },
  { url: '/login', changefreq: 'monthly', priority: 0.3 },
  { url: '/signup', changefreq: 'monthly', priority: 0.5 },
]

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

function generateUrlEntry(entry: SitemapEntry): string {
  const lastmodTag = entry.lastmod
    ? `\n    <lastmod>${formatDate(entry.lastmod)}</lastmod>`
    : ''

  return `  <url>
    <loc>${escapeXml(`${SITE_URL}${entry.url}`)}</loc>${lastmodTag}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
}

async function getBlogPosts(): Promise<SitemapEntry[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (!posts) return []

    return posts.map((post) => ({
      url: `/blog/${post.slug}`,
      lastmod: post.updated_at || post.published_at,
      changefreq: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    return []
  }
}

async function getChangelogEntries(): Promise<SitemapEntry[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: versions } = await supabase
      .from('changelog_versions')
      .select('version, released_at')
      .order('released_at', { ascending: false })

    if (!versions) return []

    return versions.map((version) => ({
      url: `/changelog#v${version.version.replace(/\./g, '-')}`,
      lastmod: version.released_at,
      changefreq: 'monthly' as const,
      priority: 0.5,
    }))
  } catch {
    return []
  }
}

function getDocumentationPages(): SitemapEntry[] {
  const entries: SitemapEntry[] = []

  for (const section of docsNavigation) {
    entries.push({
      url: `/docs/${section.slug}`,
      changefreq: 'monthly',
      priority: 0.7,
    })

    for (const item of section.items) {
      entries.push({
        url: `/docs/${section.slug}/${item.slug}`,
        changefreq: 'monthly',
        priority: 0.6,
      })
    }
  }

  return entries
}

async function getMarketplaceAgents(): Promise<SitemapEntry[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: agents } = await supabase
      .from('marketplace_agents')
      .select('slug, updated_at, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (!agents) return []

    return agents.map((agent) => ({
      url: `/marketplace/${agent.slug}`,
      lastmod: agent.updated_at || agent.created_at,
      changefreq: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    return []
  }
}

export async function GET() {
  const today = formatDate(new Date())

  const staticWithDates = staticPages.map((page) => ({
    ...page,
    lastmod: today,
  }))

  const [blogPosts, changelogEntries, marketplaceAgents] = await Promise.all([
    getBlogPosts(),
    getChangelogEntries(),
    getMarketplaceAgents(),
  ])

  const documentationPages = getDocumentationPages()

  const allEntries: SitemapEntry[] = [
    ...staticWithDates,
    ...blogPosts,
    ...documentationPages,
    ...changelogEntries,
    ...marketplaceAgents,
  ]

  const totalUrls = allEntries.length
  const MAX_URLS_PER_SITEMAP = 50000

  if (totalUrls <= MAX_URLS_PER_SITEMAP) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries.map(generateUrlEntry).join('\n')}
</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  }

  const sitemapCount = Math.ceil(totalUrls / MAX_URLS_PER_SITEMAP)
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: sitemapCount }, (_, i) => `  <sitemap>
    <loc>${SITE_URL}/sitemap-${i + 1}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
