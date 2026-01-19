'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Megaphone,
  BookOpen,
  ListTodo,
  Tag,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBlog, useBlogCategory, BlogPost } from '@/hooks/use-blog'
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

export default function BlogCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [currentPage, setCurrentPage] = useState(1)

  const { category, loading: categoryLoading, error: categoryError } = useBlogCategory(slug)
  const {
    posts,
    loading: postsLoading,
    error: postsError,
    totalCount,
    totalPages,
  } = useBlog({ category: slug, page: currentPage })

  const loading = categoryLoading || postsLoading
  const error = categoryError || postsError

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!categoryLoading && !category) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Category Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The category you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const CategoryIcon = categoryIcons[slug as keyof typeof categoryIcons] || FileText
  const color = categoryColors[slug as keyof typeof categoryColors] || categoryColors.blog

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Breadcrumbs
              customItems={[
                { label: 'Blog', href: '/blog' },
                { label: category?.name || 'Category', href: `/blog/category/${slug}` },
              ]}
              className="mb-6"
            />

            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className={cn('gap-1 text-base px-3 py-1', color)}>
                <CategoryIcon className="w-4 h-4" />
                {category?.name || slug}
              </Badge>
              <span className="text-muted-foreground">
                {totalCount} {totalCount === 1 ? 'post' : 'posts'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              {category?.meta_title || category?.name || 'Category'}
            </h1>

            {category?.description && (
              <p className="text-lg text-muted-foreground max-w-3xl mb-8">
                {category.description}
              </p>
            )}
          </motion.div>

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
              <h3 className="text-lg font-medium mb-2">No posts in this category</h3>
              <p className="text-muted-foreground mb-6">Check back soon for new content.</p>
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
