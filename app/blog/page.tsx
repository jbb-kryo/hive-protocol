'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  FileText,
  Clock,
  Calendar,
  Tag,
  ArrowRight,
  Loader2,
  Rss,
  Megaphone,
  BookOpen,
  ListTodo,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBlog, useBlogCategories, useBlogTags, BlogPost } from '@/hooks/use-blog'
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

function PostCard({ post, index }: { post: BlogPost; index: number }) {
  const config = categoryConfig[post.category]
  const CategoryIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/blog/${post.slug}`}>
        <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg group">
          {post.cover_image && (
            <div className="aspect-video overflow-hidden rounded-t-lg">
              <img
                src={post.cover_image}
                alt={`${post.title} - HIVE Protocol AI agent blog article`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn('gap-1', config.color)}>
                <CategoryIcon className="w-3 h-3" />
                {config.label}
              </Badge>
              {post.version && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  v{post.version}
                </Badge>
              )}
            </div>
            <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </CardTitle>
            {post.excerpt && (
              <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                {post.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(post.published_at), 'MMM d, yyyy')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.read_time} min read
                </span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function FeaturedPost({ post }: { post: BlogPost }) {
  const config = categoryConfig[post.category]
  const CategoryIcon = config.icon

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="hover:border-primary/50 transition-all hover:shadow-lg group overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6">
          {post.cover_image ? (
            <div className="aspect-video md:aspect-auto md:h-full overflow-hidden">
              <img
                src={post.cover_image}
                alt={`Featured: ${post.title} - AI agent orchestration insights`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="eager"
                decoding="async"
              />
            </div>
          ) : (
            <div className="aspect-video md:aspect-auto md:h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <CategoryIcon className="w-16 h-16 text-primary/40" />
            </div>
          )}
          <div className="p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={cn('gap-1', config.color)}>
                <CategoryIcon className="w-3 h-3" />
                {config.label}
              </Badge>
              {post.version && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  v{post.version}
                </Badge>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(post.published_at), 'MMM d, yyyy')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.read_time} min read
              </span>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Blog pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {start > 1 && (
          <>
            <Button variant="ghost" size="sm" onClick={() => onPageChange(1)}>
              1
            </Button>
            {start > 2 && <span className="px-2 text-muted-foreground">...</span>}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
            <Button variant="ghost" size="sm" onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </Button>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </nav>
  )
}

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { posts, loading, error, totalPages, totalCount } = useBlog({
    category: activeTab === 'all' ? undefined : activeTab,
    page: currentPage,
  })
  const { tags } = useBlogTags()

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const featuredPost = currentPage === 1 ? posts[0] : null
  const remainingPosts = currentPage === 1 ? posts.slice(1) : posts
  const popularTags = tags.slice(0, 8)

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">AI Agent Insights and Updates</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Stay up to date with the latest AI agent news, tutorials, best practices, and platform
              updates from the HIVE Protocol team.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/blog/rss.xml" target="_blank">
                <Button variant="outline" size="sm" className="gap-2">
                  <Rss className="w-4 h-4" />
                  RSS Feed
                </Button>
              </Link>
              <Link href="/blog/authors">
                <Button variant="outline" size="sm" className="gap-2">
                  <Users className="w-4 h-4" />
                  Our Authors
                </Button>
              </Link>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
              <TabsTrigger value="tutorial">Tutorials</TabsTrigger>
              <TabsTrigger value="changelog">Changelog</TabsTrigger>
              <TabsTrigger value="announcement">News</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">{error}</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">Check back soon for new content.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {featuredPost && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <FeaturedPost post={featuredPost} />
                    </motion.div>
                  )}

                  {remainingPosts.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {remainingPosts.map((post, index) => (
                        <PostCard key={post.id} post={post} index={index} />
                      ))}
                    </div>
                  )}

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />

                  {totalCount > 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      Showing {posts.length} of {totalCount} posts
                    </p>
                  )}
                </div>
              )}
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Browse by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(categoryConfig).map(([key, value]) => {
                      const Icon = value.icon
                      return (
                        <Link
                          key={key}
                          href={`/blog/category/${key}`}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{value.label}</span>
                        </Link>
                      )
                    })}
                  </CardContent>
                </Card>

                {popularTags.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Popular Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.map((tag) => (
                          <Link key={tag.slug} href={`/blog/tag/${tag.slug}`}>
                            <Badge
                              variant="secondary"
                              className="gap-1 hover:bg-primary/10 cursor-pointer"
                            >
                              <Tag className="w-3 h-3" />
                              {tag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                      <Link href="/blog/tags" className="block mt-4">
                        <Button variant="ghost" size="sm" className="w-full gap-1">
                          View all tags
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
