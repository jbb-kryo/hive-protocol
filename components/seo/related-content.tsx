'use client'

import Link from 'next/link'
import { ArrowRight, FileText, BookOpen, Newspaper } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface RelatedItem {
  title: string
  description: string
  href: string
  type: 'blog' | 'docs' | 'page'
  category?: string
}

interface RelatedContentProps {
  items: RelatedItem[]
  title?: string
  className?: string
}

const typeIcons = {
  blog: Newspaper,
  docs: BookOpen,
  page: FileText,
}

const typeLabels = {
  blog: 'Blog Post',
  docs: 'Documentation',
  page: 'Page',
}

export function RelatedContent({ items, title = 'Related Content', className = '' }: RelatedContentProps) {
  if (items.length === 0) return null

  return (
    <section className={`${className}`} aria-labelledby="related-content-heading">
      <h2 id="related-content-heading" className="text-xl font-semibold mb-4">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = typeIcons[item.type]
          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Icon className="h-3 w-3" />
                    <span>{item.category || typeLabels[item.type]}</span>
                  </div>
                  <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 text-sm">
                    {item.description}
                  </CardDescription>
                  <div className="flex items-center gap-1 mt-3 text-sm text-primary font-medium">
                    Read more
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

interface RelatedDocsProps {
  currentSlug: string
  currentSection: string
  className?: string
}

export function RelatedDocs({ currentSlug, currentSection, className = '' }: RelatedDocsProps) {
  const docsStructure: Record<string, RelatedItem[]> = {
    'getting-started': [
      { title: 'Quick Start Guide', description: 'Get up and running in minutes', href: '/docs/getting-started/quick-start', type: 'docs', category: 'Getting Started' },
      { title: 'Installation', description: 'Install and configure HIVE', href: '/docs/getting-started/installation', type: 'docs', category: 'Getting Started' },
      { title: 'Core Concepts', description: 'Understand key concepts', href: '/docs/getting-started/concepts', type: 'docs', category: 'Getting Started' },
    ],
    'agents': [
      { title: 'Creating Agents', description: 'Build your first AI agent', href: '/docs/agents/creating-agents', type: 'docs', category: 'Agents' },
      { title: 'Agent Configuration', description: 'Configure agent behavior', href: '/docs/agents/configuration', type: 'docs', category: 'Agents' },
      { title: 'Agent Templates', description: 'Pre-built agent templates', href: '/agents/templates', type: 'page', category: 'Agents' },
    ],
    'swarms': [
      { title: 'Swarm Basics', description: 'Multi-agent collaboration', href: '/docs/swarms/basics', type: 'docs', category: 'Swarms' },
      { title: 'Coordination Patterns', description: 'Agent coordination strategies', href: '/docs/swarms/coordination', type: 'docs', category: 'Swarms' },
      { title: 'Swarm Dashboard', description: 'Manage your swarms', href: '/swarms', type: 'page', category: 'Swarms' },
    ],
    'api': [
      { title: 'API Reference', description: 'Complete API documentation', href: '/docs/api/reference', type: 'docs', category: 'API' },
      { title: 'Authentication', description: 'API authentication guide', href: '/docs/api/authentication', type: 'docs', category: 'API' },
      { title: 'Rate Limits', description: 'API rate limiting', href: '/docs/api/rate-limits', type: 'docs', category: 'API' },
    ],
  }

  const related = Object.entries(docsStructure)
    .filter(([section]) => section !== currentSection)
    .flatMap(([, items]) => items)
    .filter(item => !item.href.includes(currentSlug))
    .slice(0, 3)

  return <RelatedContent items={related} title="Related Documentation" className={className} />
}

interface RelatedBlogPostsProps {
  currentSlug: string
  tags?: string[]
  className?: string
}

export function RelatedBlogPosts({ currentSlug, className = '' }: RelatedBlogPostsProps) {
  const blogPosts: RelatedItem[] = [
    { title: 'Building Multi-Agent Systems', description: 'Learn how to create effective multi-agent architectures', href: '/blog/building-multi-agent-systems', type: 'blog', category: 'Tutorials' },
    { title: 'AI Agent Best Practices', description: 'Tips for building reliable AI agents', href: '/blog/ai-agent-best-practices', type: 'blog', category: 'Best Practices' },
    { title: 'Swarm Intelligence in Action', description: 'Real-world applications of swarm intelligence', href: '/blog/swarm-intelligence-action', type: 'blog', category: 'Case Studies' },
    { title: 'Getting Started with HIVE', description: 'A comprehensive introduction to the platform', href: '/blog/getting-started-hive', type: 'blog', category: 'Getting Started' },
    { title: 'Advanced Agent Coordination', description: 'Deep dive into coordination patterns', href: '/blog/advanced-agent-coordination', type: 'blog', category: 'Advanced' },
  ]

  const related = blogPosts
    .filter(post => !post.href.includes(currentSlug))
    .slice(0, 3)

  return <RelatedContent items={related} title="Related Articles" className={className} />
}

export function QuickLinks({ className = '' }: { className?: string }) {
  const links: RelatedItem[] = [
    { title: 'Documentation', description: 'Learn how to use HIVE', href: '/docs', type: 'docs' },
    { title: 'Agent Marketplace', description: 'Discover pre-built agents', href: '/marketplace', type: 'page' },
    { title: 'API Reference', description: 'Integrate with our API', href: '/docs/api/reference', type: 'docs' },
  ]

  return <RelatedContent items={links} title="Quick Links" className={className} />
}
