'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Book,
  Bot,
  Network,
  Brain,
  Puzzle,
  Code,
  Terminal,
  Shield,
  ArrowRight,
  Zap,
  Users,
  Lock,
  Search,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { docsNavigation, searchDocs } from '@/lib/docs-content'

const iconMap: Record<string, typeof Book> = {
  Book,
  Bot,
  Network,
  Brain,
  Puzzle,
  Code,
  Terminal,
  Shield,
}

const sectionDescriptions: Record<string, string> = {
  'getting-started': 'Core concepts, quick start guide, and foundational knowledge',
  'agents': 'Create, configure, and manage intelligent AI agents',
  'swarms': 'Coordinate multiple agents for complex tasks',
  'models': 'Configure AI models and manage API integrations',
  'integrations': 'Connect with external services and tools',
  'api': 'Complete REST API documentation and examples',
  'local-setup': 'Self-hosted deployment and configuration',
  'security': 'Authentication, authorization, and best practices',
}

const features = [
  {
    icon: Bot,
    title: 'Multi-Agent Orchestration',
    description: 'Create and coordinate multiple AI agents working together on complex tasks.',
  },
  {
    icon: Users,
    title: 'Human-in-the-Loop',
    description: 'Maintain control with flexible collaboration modes: observe, collaborate, or direct.',
  },
  {
    icon: Lock,
    title: 'Cryptographic Verification',
    description: 'Every agent message is signed and verified to ensure authenticity.',
  },
  {
    icon: Zap,
    title: 'Real-Time Streaming',
    description: 'Watch agents think and respond in real-time with live message streaming.',
  },
]

const popularDocs = [
  { section: 'getting-started', slug: 'quickstart', title: 'Quick Start Guide' },
  { section: 'agents', slug: 'creating-agents', title: 'Creating Agents' },
  { section: 'swarms', slug: 'creating-swarms', title: 'Creating Swarms' },
  { section: 'api', slug: 'authentication', title: 'API Authentication' },
]

interface SearchResult {
  section: string
  slug: string
  title: string
  excerpt: string
}

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    if (value.length >= 2) {
      const results = searchDocs(value)
      setSearchResults(results)
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [])

  const getSectionSlug = (sectionTitle: string) => {
    return docsNavigation.find((s) => s.title === sectionTitle)?.slug || ''
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">HIVE Protocol Documentation</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Learn how to build powerful multi-agent AI systems with HIVE Protocol.
          From quick start guides to advanced API configuration.
        </p>

        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="pl-10 h-12 text-base"
          />

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
              {searchResults.slice(0, 8).map((result, index) => (
                <Link
                  key={`${result.section}-${result.slug}-${index}`}
                  href={`/docs/${getSectionSlug(result.section)}/${result.slug}`}
                  className="block p-3 hover:bg-muted transition-colors border-b last:border-0"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{result.section}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium">{result.title}</span>
                  </div>
                  {result.excerpt && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {result.excerpt}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground">
              No results found for &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <Badge className="mb-3">Recommended</Badge>
                <h2 className="text-2xl font-bold mb-2">Quick Start Guide</h2>
                <p className="text-muted-foreground mb-4">
                  Get your first agent swarm running in under 5 minutes.
                  We&apos;ll walk you through setup, configuration, and your first conversation.
                </p>
                <Link href="/docs/getting-started/quickstart">
                  <Button className="gap-2">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Zap className="w-16 h-16 text-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-12"
      >
        <h2 className="text-xl font-semibold mb-4">Popular Articles</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularDocs.map((doc) => (
            <Link key={doc.slug} href={`/docs/${doc.section}/${doc.slug}`}>
              <Card className="h-full hover:border-primary/50 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {doc.title}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-xl font-semibold mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-semibold mb-4">Documentation Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docsNavigation.map((section, index) => {
            const Icon = iconMap[section.icon] || Book
            const firstItem = section.items[0]
            const description = sectionDescriptions[section.slug] || ''

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Link href={`/docs/${section.slug}/${firstItem.slug}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base group-hover:text-primary transition-colors">
                            {section.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {section.items.length} articles
                          </CardDescription>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">{description}</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {section.items.slice(0, 3).map((item) => (
                          <li key={item.id} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            {item.title}
                          </li>
                        ))}
                        {section.items.length > 3 && (
                          <li className="text-xs text-muted-foreground/70">
                            +{section.items.length - 3} more articles
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 pt-12 border-t"
      >
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">API Reference</h2>
            <p className="text-muted-foreground mb-4">
              Complete REST API documentation with examples in multiple languages.
            </p>
            <Link href="/docs/api/authentication">
              <Button variant="outline" className="gap-2">
                <Code className="w-4 h-4" />
                View API Docs
              </Button>
            </Link>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Need Help?</h2>
            <p className="text-muted-foreground mb-4">
              Can&apos;t find what you&apos;re looking for? Check our community or contact support.
            </p>
            <div className="flex gap-4">
              <Link href="/community">
                <Button variant="outline">Community</Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
