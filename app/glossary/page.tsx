'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, BookOpen, ArrowRight, ChevronRight } from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import {
  glossaryTerms,
  glossaryCategories,
  getAlphabeticalGroups,
  searchTerms,
  GlossaryTerm,
} from '@/lib/glossary-data'

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const alphabeticalGroups = useMemo(() => getAlphabeticalGroups(), [])
  const allLetters = alphabeticalGroups.map((g) => g.letter)

  const filteredTerms = useMemo(() => {
    let terms = glossaryTerms

    if (searchQuery) {
      terms = searchTerms(searchQuery)
    }

    if (selectedCategory) {
      terms = terms.filter((t) => t.category === selectedCategory)
    }

    return terms.sort((a, b) => a.term.localeCompare(b.term))
  }, [searchQuery, selectedCategory])

  const groupedFilteredTerms = useMemo(() => {
    const groups: { [key: string]: GlossaryTerm[] } = {}
    filteredTerms.forEach((term) => {
      const letter = term.term[0].toUpperCase()
      if (!groups[letter]) {
        groups[letter] = []
      }
      groups[letter].push(term)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, terms]) => ({ letter, terms }))
  }, [filteredTerms])

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <JsonLd
        data={[
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: 'https://https://hive-protocol.online' },
              { name: 'Glossary', url: 'https://hive-protocol.online/glossary' },
            ],
          },
          ...glossaryTerms.slice(0, 20).map((term) => ({
            type: 'DefinedTerm' as const,
            name: term.term,
            description: term.shortDefinition,
            url: `https://hive-protocol.online/glossary/${term.slug}`,
          })),
        ]}
      />
      <Navbar />
      <main className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <Breadcrumbs className="mb-8" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center mb-12"
          >
            <Badge className="mb-4">AI & Machine Learning Reference</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Glossary</h1>
            <p className="text-lg text-muted-foreground mb-8">
              A comprehensive dictionary of artificial intelligence, machine learning, and AI agent
              terminology. Learn the concepts that power modern AI systems.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {glossaryCategories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-1 mb-12 px-4">
            {allLetters.map((letter) => {
              const hasTerms = groupedFilteredTerms.some((g) => g.letter === letter)
              return (
                <button
                  key={letter}
                  onClick={() => hasTerms && scrollToLetter(letter)}
                  disabled={!hasTerms}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    hasTerms
                      ? 'hover:bg-primary hover:text-primary-foreground cursor-pointer'
                      : 'text-muted-foreground/30 cursor-not-allowed'
                  }`}
                >
                  {letter}
                </button>
              )
            })}
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {groupedFilteredTerms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No terms found matching &quot;{searchQuery}&quot;
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              </div>
            ) : (
              groupedFilteredTerms.map(({ letter, terms }) => (
                <motion.div
                  key={letter}
                  id={`letter-${letter}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{letter}</span>
                    </div>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid gap-3">
                    {terms.map((term) => (
                      <Link key={term.slug} href={`/glossary/${term.slug}`}>
                        <Card className="p-4 hover:border-primary/50 transition-colors group">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h2 className="font-semibold group-hover:text-primary transition-colors">
                                  {term.term}
                                </h2>
                                <Badge variant="secondary" className="text-xs">
                                  {term.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {term.shortDefinition}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mt-20 text-center"
          >
            <Card className="p-8">
              <BookOpen className="w-12 h-12 text-primary/20 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Ready to Build with AI Agents?</h2>
              <p className="text-muted-foreground mb-6">
                Now that you understand the terminology, start building your own AI agent swarms
                with HIVE.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button className="gap-2">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline">Read Documentation</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
