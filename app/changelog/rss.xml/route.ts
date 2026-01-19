import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response('Configuration error', { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: versions } = await supabase
    .from('changelog_versions')
    .select('*')
    .order('released_at', { ascending: false })
    .limit(20)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hive-protocol.com'

  const items = versions?.map((version) => {
    const pubDate = new Date(version.released_at).toUTCString()
    return `
    <item>
      <title>v${escapeXml(version.version)} - ${escapeXml(version.title)}</title>
      <link>${baseUrl}/changelog#v${version.version}</link>
      <guid isPermaLink="false">changelog-${version.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${version.description || version.title}]]></description>
    </item>`
  }).join('') || ''

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>HIVE Protocol Changelog</title>
    <link>${baseUrl}/changelog</link>
    <description>Latest updates, features, and improvements to HIVE Protocol</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/changelog/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
