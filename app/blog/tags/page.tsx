'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tag, Loader2, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useBlogTags } from '@/hooks/use-blog'

export default function BlogTagsPage() {
  const { tags, loading, error } = useBlogTags()

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Breadcrumbs
              customItems={[
                { label: 'Blog', href: '/blog' },
                { label: 'Tags', href: '/blog/tags' },
              ]}
              className="mb-6"
            />

            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Browse by Tag</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mb-8">
              Explore our content organized by topic. Find articles, tutorials, and guides on
              specific subjects.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-20">
              <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tags yet</h3>
              <p className="text-muted-foreground">Check back soon for tagged content.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag, index) => (
                <motion.div
                  key={tag.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/blog/tag/${tag.slug}`}>
                    <Card className="hover:border-primary/50 transition-all hover:shadow-lg group h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="gap-1">
                            <Tag className="w-3 h-3" />
                            {tag.name}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold mb-1">{tag.post_count}</p>
                        <p className="text-sm text-muted-foreground">
                          {tag.post_count === 1 ? 'post' : 'posts'}
                        </p>
                        {tag.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {tag.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
