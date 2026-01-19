'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  FileText,
  Clock,
  Calendar,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Megaphone,
  BookOpen,
  ListTodo,
  Twitter,
  Linkedin,
  Github,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBlog, useBlogAuthor, BlogPost } from '@/hooks/use-blog'
import { cn } from '@/lib/utils'

const categoryIcons = {
  blog: FileText,
  changelog: ListTodo,
  announcement: Megaphone,
  tutorial: BookOpen,
}

const categoryColors = {
  blog: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  changelog: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  announcement: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  tutorial: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
}

function PostCard({ post, index }: { post: BlogPost; index: number }) {
  const CategoryIcon = categoryIcons[post.category] || FileText
  const color = categoryColors[post.category] || categoryColors.blog

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
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn('gap-1', color)}>
                <CategoryIcon className="w-3 h-3" />
                {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
              </Badge>
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
                  {post.read_time} min
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
    <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
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

export default function BlogAuthorPage() {
  const params = useParams()
  const slug = params.slug as string
  const [currentPage, setCurrentPage] = useState(1)

  const { author, loading: authorLoading } = useBlogAuthor(slug)
  const {
    posts,
    loading: postsLoading,
    error: postsError,
    totalCount,
    totalPages,
  } = useBlog({ authorSlug: slug, page: currentPage })

  const loading = authorLoading || postsLoading

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!authorLoading && !author) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Author Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The author you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const initials = author?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Breadcrumbs
              customItems={[
                { label: 'Blog', href: '/blog' },
                { label: 'Authors', href: '/blog/authors' },
                { label: author?.name || 'Author', href: `/blog/author/${slug}` },
              ]}
              className="mb-6"
            />

            <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8 p-6 bg-muted/30 rounded-lg">
              <Avatar className="w-24 h-24 text-2xl">
                <AvatarImage src={author?.avatar_url || undefined} alt={author?.name} />
                <AvatarFallback>{initials || 'AU'}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">{author?.name}</h1>
                {author?.title && (
                  <p className="text-muted-foreground mb-3">{author.title}</p>
                )}
                {author?.bio && (
                  <p className="text-muted-foreground mb-4 max-w-2xl">{author.bio}</p>
                )}

                <div className="flex items-center gap-3">
                  {author?.social_twitter && (
                    <a
                      href={`https://twitter.com/${author.social_twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`Follow ${author.name} on Twitter`}
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {author?.social_linkedin && (
                    <a
                      href={author.social_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`Connect with ${author.name} on LinkedIn`}
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {author?.social_github && (
                    <a
                      href={`https://github.com/${author.social_github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`View ${author.name}'s GitHub profile`}
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="text-center md:text-right">
                <p className="text-3xl font-bold">{totalCount}</p>
                <p className="text-sm text-muted-foreground">
                  {totalCount === 1 ? 'article' : 'articles'}
                </p>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-6">Articles by {author?.name}</h2>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : postsError ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">{postsError}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-6">
                This author hasn&apos;t published any articles yet.
              </p>
              <Link href="/blog">
                <Button variant="outline">View All Posts</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
