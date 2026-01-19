import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function escapeXml(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripMarkdown(markdown: string | null | undefined): string {
  if (!markdown) return ''
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function formatRFC822Date(date: string | Date): string {
  const d = new Date(date)
  return d.toUTCString()
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response('Configuration error', { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('RSS feed error:', error)
    return new Response('Failed to fetch posts', { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hive-protocol.online'
  const now = formatRFC822Date(new Date())

  const rssItems = (posts || [])
    .map((post) => {
      const postUrl = `${siteUrl}/blog/${post.slug}`
      const pubDate = post.published_at
        ? formatRFC822Date(post.published_at)
        : now

      const plainContent = stripMarkdown(post.content)
      const description = post.excerpt || plainContent.slice(0, 300) + (plainContent.length > 300 ? '...' : '')

      const categoryTags = post.category
        ? `\n      <category>${escapeXml(post.category)}</category>`
        : ''

      const tagCategories = (post.tags || [])
        .map((tag: string) => `\n      <category>${escapeXml(tag)}</category>`)
        .join('')

      const authorTag = post.author_name
        ? `\n      <dc:creator>${escapeXml(post.author_name)}</dc:creator>`
        : ''

      const enclosure = post.cover_image
        ? `\n      <enclosure url="${escapeXml(post.cover_image)}" type="image/jpeg" length="0"/>`
        : ''

      const contentEncoded = post.content
        ? `\n      <content:encoded><![CDATA[${post.content}]]></content:encoded>`
        : ''

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>${categoryTags}${tagCategories}${authorTag}${enclosure}${contentEncoded}
    </item>`
    })
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>HIVE Protocol Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Stay up to date with the latest news, tutorials, and updates from the HIVE Protocol team. Learn about multi-agent AI systems, swarm intelligence, and collaboration tools.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>HIVE Protocol Blog</title>
      <link>${siteUrl}/blog</link>
      <width>144</width>
      <height>144</height>
    </image>
    <copyright>Copyright ${new Date().getFullYear()} HIVE Protocol. All rights reserved.</copyright>
    <managingEditor>https://hive-protocol.online (HIVE Team)</managingEditor>
    <webMaster>team@https://hive-protocol.online (HIVE Team)</webMaster>
    <category>Technology</category>
    <category>Artificial Intelligence</category>
    <category>Multi-Agent Systems</category>
    <generator>HIVE Protocol RSS Generator</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>${rssItems}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
