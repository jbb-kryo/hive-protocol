import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { createDynamicTitle, truncateTitle, truncateDescription } from '@/lib/seo'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image, published_at, author_name, tags')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!post) {
    return {
      title: 'Post Not Found | HIVE',
      alternates: {
        canonical: '/blog',
      },
    }
  }

  const pageTitle = createDynamicTitle(post.title, 'Blog')
  const description = truncateDescription(
    post.excerpt || `Read ${post.title} on the HIVE blog. Expert insights on AI agents and multi-agent collaboration.`
  )

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
    openGraph: {
      title: truncateTitle(post.title),
      description,
      type: 'article',
      siteName: 'HIVE',
      publishedTime: post.published_at || undefined,
      authors: post.author_name ? [post.author_name] : undefined,
      tags: post.tags || undefined,
      images: post.cover_image ? [{ url: post.cover_image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: truncateTitle(post.title),
      description,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  }
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
