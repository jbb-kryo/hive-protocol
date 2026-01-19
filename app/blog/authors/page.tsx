'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Loader2, ArrowRight, Twitter, Linkedin, Github } from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBlogAuthors } from '@/hooks/use-blog'

export default function BlogAuthorsPage() {
  const { authors, loading, error } = useBlogAuthors()

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
              ]}
              className="mb-6"
            />

            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Our Authors</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mb-8">
              Meet the team behind the HIVE Protocol blog. Our authors share insights on AI agents,
              swarm intelligence, and building the future of multi-agent orchestration.
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
          ) : authors.length === 0 ? (
            <div className="text-center py-20">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No authors yet</h3>
              <p className="text-muted-foreground">Check back soon.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {authors.map((author, index) => {
                const initials = author.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <motion.div
                    key={author.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/blog/author/${author.slug}`}>
                      <Card className="hover:border-primary/50 transition-all hover:shadow-lg group h-full">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                          <Avatar className="w-16 h-16 text-lg">
                            <AvatarImage src={author.avatar_url || undefined} alt={author.name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                              {author.name}
                            </h3>
                            {author.title && (
                              <p className="text-sm text-muted-foreground truncate">{author.title}</p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all flex-shrink-0" />
                        </CardHeader>
                        <CardContent>
                          {author.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                              {author.bio}
                            </p>
                          )}
                          <div className="flex items-center gap-3">
                            {author.social_twitter && (
                              <Twitter className="w-4 h-4 text-muted-foreground" />
                            )}
                            {author.social_linkedin && (
                              <Linkedin className="w-4 h-4 text-muted-foreground" />
                            )}
                            {author.social_github && (
                              <Github className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
