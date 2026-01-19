'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  Loader2,
  FileText,
  Megaphone,
  BookOpen,
  ListTodo,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { SocialShare } from '@/components/blog/social-share'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBlogPost, useRelatedPosts, useBlogAuthor } from '@/hooks/use-blog'
import { parseMarkdown } from '@/lib/markdown'
import { cn } from '@/lib/utils'

const categoryConfig = {
  blog: {
    icon: FileText,
    label: 'Blog',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  changelog: {
    icon: ListTodo,
    label: 'Changelog',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  announcement: {
    icon: Megaphone,
    label: 'Announcement',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  tutorial: {
    icon: BookOpen,
    label: 'Tutorial',
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  },
}

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { post, loading, error } = useBlogPost(slug)
  const { posts: relatedPosts, loading: relatedLoading } = useRelatedPosts(
    slug,
    post?.tags || [],
    post?.category || 'blog',
    3
  )
  const { author } = useBlogAuthor(post?.author_slug || '')

  useEffect(() => {
    if (!loading && !post && !error) {
      router.push('/blog')
    }
  }, [loading, post, error, router])

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </main>
    )
  }

  if (error || !post) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The post you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const config = categoryConfig[post.category]
  const CategoryIcon = config.icon
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const wasUpdated = post.updated_at && post.published_at &&
    new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > 86400000
  const wordCount = post.content ? post.content.split(/\s+/).filter(Boolean).length : undefined
  const articleUrl = `https://hive-protocol.online/blog/${post.slug}`

  return (
    <main className="min-h-screen">
      <JsonLd
        data={{
          type: 'Article',
          headline: post.title,
          description: post.excerpt || post.title,
          url: articleUrl,
          datePublished: post.published_at || new Date().toISOString(),
          dateModified: post.updated_at || post.published_at || new Date().toISOString(),
          author: {
            name: author?.name || post.author_name || 'HIVE Team',
            url: post.author_slug
              ? `https://hive-protocol.online/blog/author/${post.author_slug}`
              : 'https://hive-protocol.online/blog/authors',
          },
          publisher: {
            name: 'HIVE',
            url: 'https://hive-protocol.online',
            logo: 'https://hive-protocol.online/logo.png',
          },
          image: post.cover_image
            ? {
                url: post.cover_image,
                width: 1200,
                height: 630,
              }
            : undefined,
          articleSection: config.label,
          keywords: post.tags,
          wordCount,
        }}
      />
      <Navbar />

      <article className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Breadcrumbs
              customItems={[
                { label: 'Blog', href: '/blog' },
                { label: config.label, href: `/blog/category/${post.category}` },
                { label: post.title, href: `/blog/${post.slug}` },
              ]}
              className="mb-6"
            />

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Link href={`/blog/category/${post.category}`}>
                <Badge variant="outline" className={cn('gap-1 hover:bg-secondary', config.color)}>
                  <CategoryIcon className="w-3 h-3" />
                  {config.label}
                </Badge>
              </Link>
              {post.version && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  v{post.version}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <Link
                href={`/blog/author/${post.author_slug || 'hive-protocol-team'}`}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <User className="w-4 h-4" />
                {author?.name || post.author_name}
              </Link>
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.published_at}>
                    {format(new Date(post.published_at), 'MMMM d, yyyy')}
                  </time>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.read_time} min read
              </span>
            </div>

            {wasUpdated && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
                <RefreshCw className="w-3 h-3" />
                Updated on{' '}
                <time dateTime={post.updated_at}>
                  {format(new Date(post.updated_at), 'MMMM d, yyyy')}
                </time>
              </p>
            )}

            <div className="mb-8">
              <SocialShare
                url={pageUrl}
                title={post.title}
                description={post.excerpt || undefined}
              />
            </div>

            {post.cover_image && (
              <div className="aspect-video rounded-lg overflow-hidden mb-8">
                <img
                  src={post.cover_image}
                  alt={`${post.title} - HIVE Protocol AI insights`}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
            )}

            <div
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
            />

            {post.tags && post.tags.length > 0 && (
              <>
                <Separator className="my-8" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground mr-2">Tags:</span>
                  {post.tags.map((tag) => (
                    <Link key={tag} href={`/blog/tag/${tag}`}>
                      <Badge
                        variant="secondary"
                        className="gap-1 hover:bg-primary/10 cursor-pointer"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </>
            )}

            <Separator className="my-8" />

            <div className="flex items-center justify-between">
              <SocialShare
                url={pageUrl}
                title={post.title}
                description={post.excerpt || undefined}
              />
            </div>
          </motion.div>
        </div>
      </article>

      {!relatedLoading && relatedPosts.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost, index) => {
                const relatedConfig = categoryConfig[relatedPost.category]
                const RelatedIcon = relatedConfig.icon

                return (
                  <motion.div
                    key={relatedPost.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/blog/${relatedPost.slug}`}>
                      <Card className="h-full hover:border-primary/50 transition-all group">
                        {relatedPost.cover_image && (
                          <div className="aspect-video overflow-hidden rounded-t-lg">
                            <img
                              src={relatedPost.cover_image}
                              alt={relatedPost.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <Badge
                            variant="outline"
                            className={cn('gap-1 w-fit mb-2', relatedConfig.color)}
                          >
                            <RelatedIcon className="w-3 h-3" />
                            {relatedConfig.label}
                          </Badge>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                            {relatedPost.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {relatedPost.excerpt}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {relatedPost.published_at && (
                              <span>{format(new Date(relatedPost.published_at), 'MMM d, yyyy')}</span>
                            )}
                            <span>{relatedPost.read_time} min read</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/blog">
            <Button variant="outline" size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
