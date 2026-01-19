import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink } from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { glossaryTerms, getTermBySlug, getTermsByCategory } from '@/lib/glossary-data'

interface PageProps {
  params: { term: string }
}

export async function generateStaticParams() {
  return glossaryTerms.map((term) => ({
    term: term.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const term = getTermBySlug(params.term)
  if (!term) return {}

  return {
    title: `${term.term} - AI Glossary Definition | HIVE`,
    description: term.shortDefinition,
    keywords: [
      term.term,
      `${term.term} definition`,
      `what is ${term.term}`,
      term.category,
      'AI terminology',
    ],
    alternates: {
      canonical: `/glossary/${term.slug}`,
    },
    openGraph: {
      title: `${term.term} - Definition | HIVE AI Glossary`,
      description: term.shortDefinition,
      type: 'article',
      url: `/glossary/${term.slug}`,
    },
  }
}

export default function GlossaryTermPage({ params }: PageProps) {
  const term = getTermBySlug(params.term)

  if (!term) {
    notFound()
  }

  const relatedTerms = term.relatedTerms
    .map((slug) => glossaryTerms.find((t) => t.slug === slug))
    .filter(Boolean)

  const categoryTerms = getTermsByCategory(term.category)
    .filter((t) => t.slug !== term.slug)
    .slice(0, 5)

  const allTermsSorted = [...glossaryTerms].sort((a, b) => a.term.localeCompare(b.term))
  const currentIndex = allTermsSorted.findIndex((t) => t.slug === term.slug)
  const prevTerm = currentIndex > 0 ? allTermsSorted[currentIndex - 1] : null
  const nextTerm = currentIndex < allTermsSorted.length - 1 ? allTermsSorted[currentIndex + 1] : null

  return (
    <>
      <JsonLd
        data={[
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: 'https://hive-protocol.online' },
              { name: 'Glossary', url: 'https://https://hive-protocol.online/glossary' },
              { name: term.term, url: `https://https://hive-protocol.online/glossary/${term.slug}` },
            ],
          },
          {
            type: 'DefinedTerm',
            name: term.term,
            description: term.fullDefinition,
            url: `https://https://hive-protocol.online/glossary/${term.slug}`,
          },
        ]}
      />
      <Navbar />
      <main className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <Breadcrumbs className="mb-8" />

          <div className="max-w-3xl mx-auto">
            <Link href="/glossary">
              <Button variant="ghost" size="sm" className="mb-6 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Glossary
              </Button>
            </Link>

            <article>
              <header className="mb-8">
                <Badge className="mb-4">{term.category}</Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{term.term}</h1>
                <p className="text-xl text-muted-foreground">{term.shortDefinition}</p>
              </header>

              <Card className="p-6 md:p-8 mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Full Definition
                </h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed">{term.fullDefinition}</p>
                </div>
              </Card>

              {term.seeAlso && term.seeAlso.length > 0 && (
                <Card className="p-6 mb-8">
                  <h2 className="text-lg font-semibold mb-4">Learn More</h2>
                  <div className="flex flex-wrap gap-2">
                    {term.seeAlso.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <Badge
                          variant="secondary"
                          className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                        >
                          {link.text}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {relatedTerms.length > 0 && (
                <Card className="p-6 mb-8">
                  <h2 className="text-lg font-semibold mb-4">Related Terms</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {relatedTerms.map((related) =>
                      related ? (
                        <Link key={related.slug} href={`/glossary/${related.slug}`}>
                          <div className="p-3 rounded-lg border hover:border-primary/50 transition-colors">
                            <p className="font-medium text-sm">{related.term}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {related.shortDefinition}
                            </p>
                          </div>
                        </Link>
                      ) : null
                    )}
                  </div>
                </Card>
              )}

              {categoryTerms.length > 0 && (
                <Card className="p-6 mb-8">
                  <h2 className="text-lg font-semibold mb-4">More in {term.category}</h2>
                  <div className="space-y-2">
                    {categoryTerms.map((catTerm) => (
                      <Link
                        key={catTerm.slug}
                        href={`/glossary/${catTerm.slug}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowRight className="w-3 h-3" />
                        {catTerm.term}
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </article>

            <nav className="flex justify-between items-center pt-8 border-t">
              {prevTerm ? (
                <Link href={`/glossary/${prevTerm.slug}`}>
                  <Button variant="ghost" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">{prevTerm.term}</span>
                    <span className="sm:hidden">Previous</span>
                  </Button>
                </Link>
              ) : (
                <div />
              )}
              {nextTerm ? (
                <Link href={`/glossary/${nextTerm.slug}`}>
                  <Button variant="ghost" className="gap-2">
                    <span className="hidden sm:inline">{nextTerm.term}</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
