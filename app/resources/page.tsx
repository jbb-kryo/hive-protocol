'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen,
  FileText,
  Video,
  Code,
  Lightbulb,
  Rocket,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Clock,
  Search,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'

interface Resource {
  title: string
  description: string
  href: string
  type: 'guide' | 'tutorial' | 'reference' | 'video'
  category: string
  readTime?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  featured?: boolean
}

const resources: Resource[] = [
  {
    title: 'Getting Started with AI Agents',
    description: 'Learn the fundamentals of AI agents, how they work, and how to build your first autonomous agent with HIVE.',
    href: '/docs/getting-started/quickstart',
    type: 'guide',
    category: 'Getting Started',
    readTime: '10 min',
    level: 'beginner',
    featured: true,
  },
  {
    title: 'Understanding Multi-Agent Systems',
    description: 'Deep dive into multi-agent architectures, agent communication patterns, and collaborative AI workflows.',
    href: '/docs/swarms/creating-swarms',
    type: 'guide',
    category: 'Core Concepts',
    readTime: '15 min',
    level: 'intermediate',
    featured: true,
  },
  {
    title: 'Prompt Engineering for Agents',
    description: 'Master the art of crafting effective system prompts that shape agent behavior, personality, and capabilities.',
    href: '/docs/agents/system-prompts',
    type: 'tutorial',
    category: 'Best Practices',
    readTime: '12 min',
    level: 'intermediate',
  },
  {
    title: 'Building Custom Tools',
    description: 'Create powerful tools that extend agent capabilities with APIs, databases, and external services.',
    href: '/docs/tools/custom-tools',
    type: 'tutorial',
    category: 'Development',
    readTime: '20 min',
    level: 'intermediate',
    featured: true,
  },
  {
    title: 'Agent Security Best Practices',
    description: 'Implement robust security measures including authentication, rate limiting, and input validation for AI agents.',
    href: '/docs/security/overview',
    type: 'guide',
    category: 'Security',
    readTime: '18 min',
    level: 'advanced',
  },
  {
    title: 'API Authentication Guide',
    description: 'Complete guide to authenticating with the HIVE API using API keys, OAuth, and service accounts.',
    href: '/docs/api/authentication',
    type: 'reference',
    category: 'API',
    readTime: '8 min',
    level: 'beginner',
  },
  {
    title: 'Webhook Integration Tutorial',
    description: 'Connect HIVE to your existing systems with webhooks for real-time event notifications and automation.',
    href: '/docs/integrations/webhooks',
    type: 'tutorial',
    category: 'Integration',
    readTime: '15 min',
    level: 'intermediate',
  },
  {
    title: 'Human-in-the-Loop Patterns',
    description: 'Learn when and how to incorporate human oversight in autonomous agent workflows for safety and quality.',
    href: '/docs/swarms/agent-coordination',
    type: 'guide',
    category: 'Best Practices',
    readTime: '14 min',
    level: 'intermediate',
  },
  {
    title: 'Optimizing Agent Performance',
    description: 'Techniques for improving agent response times, reducing costs, and handling high-volume workloads.',
    href: '/docs/agents/performance',
    type: 'guide',
    category: 'Performance',
    readTime: '16 min',
    level: 'advanced',
  },
  {
    title: 'Model Selection Guide',
    description: 'Choose the right AI model for your use case. Compare GPT-4, Claude, Gemini, and open-source alternatives.',
    href: '/docs/models/comparison',
    type: 'reference',
    category: 'Core Concepts',
    readTime: '10 min',
    level: 'beginner',
  },
  {
    title: 'Context Management Strategies',
    description: 'Manage conversation context, knowledge bases, and long-term memory for more capable AI agents.',
    href: '/docs/agents/context',
    type: 'guide',
    category: 'Development',
    readTime: '12 min',
    level: 'intermediate',
  },
  {
    title: 'Enterprise Deployment Guide',
    description: 'Deploy HIVE in enterprise environments with SSO, compliance controls, and infrastructure requirements.',
    href: '/docs/enterprise/deployment',
    type: 'guide',
    category: 'Enterprise',
    readTime: '25 min',
    level: 'advanced',
  },
]

const categories = Array.from(new Set(resources.map((r) => r.category)))

const typeIcons = {
  guide: BookOpen,
  tutorial: Code,
  reference: FileText,
  video: Video,
}

const levelColors = {
  beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  advanced: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      !searchQuery ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || resource.category === selectedCategory
    const matchesLevel = !selectedLevel || resource.level === selectedLevel
    return matchesSearch && matchesCategory && matchesLevel
  })

  const featuredResources = resources.filter((r) => r.featured)

  return (
    <>
      <JsonLd
        data={{
          type: 'BreadcrumbList',
          items: [
            { name: 'Home', url: 'https://hiveprotocol.ai' },
            { name: 'Resources', url: 'https://hiveprotocol.ai/resources' },
          ],
        }}
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
            <Badge className="mb-4">Learning Resources</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AI Agent Development Resources
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Guides, tutorials, and reference materials to help you build powerful AI agent
              systems. From beginner fundamentals to advanced techniques.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          {!searchQuery && !selectedCategory && !selectedLevel && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Featured Resources</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {featuredResources.map((resource, index) => {
                  const Icon = typeIcons[resource.type]
                  return (
                    <motion.div
                      key={resource.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={resource.href}>
                        <Card className="h-full hover:border-primary/50 transition-colors group">
                          <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {resource.type}
                              </Badge>
                            </div>
                            <CardTitle className="group-hover:text-primary transition-colors">
                              {resource.title}
                            </CardTitle>
                            <CardDescription>{resource.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-3 text-sm">
                              {resource.readTime && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {resource.readTime}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${levelColors[resource.level]}`}>
                                {resource.level}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )}

          <section>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Button>
                {categories.map((cat) => (
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
              <div className="flex gap-2 sm:ml-auto">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                    className="capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {filteredResources.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No resources found matching your criteria</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory(null)
                    setSelectedLevel(null)
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResources.map((resource, index) => {
                  const Icon = typeIcons[resource.type]
                  return (
                    <motion.div
                      key={resource.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Link href={resource.href}>
                        <Card className="h-full hover:border-primary/50 transition-colors group">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm group-hover:text-primary transition-colors mb-1">
                                  {resource.title}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {resource.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="secondary" className="text-xs">
                                    {resource.category}
                                  </Badge>
                                  {resource.readTime && (
                                    <span className="text-muted-foreground">{resource.readTime}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <BookOpen className="w-10 h-10 text-primary/20 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">AI Glossary</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive dictionary of AI and ML terminology
                </p>
                <Link href="/glossary">
                  <Button variant="outline" size="sm" className="gap-2">
                    Browse Terms
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </Card>
              <Card className="p-6 text-center">
                <FileText className="w-10 h-10 text-primary/20 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">API Reference</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete API documentation with examples
                </p>
                <Link href="/docs/api/authentication">
                  <Button variant="outline" size="sm" className="gap-2">
                    View API Docs
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </Card>
              <Card className="p-6 text-center">
                <Users className="w-10 h-10 text-primary/20 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join discussions and get help from other builders
                </p>
                <Link href="/community">
                  <Button variant="outline" size="sm" className="gap-2">
                    Join Community
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </Card>
            </div>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mt-16 text-center"
          >
            <Card className="p-8">
              <Rocket className="w-12 h-12 text-primary/20 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Ready to Start Building?</h2>
              <p className="text-muted-foreground mb-6">
                Put your knowledge into practice. Create your first AI agent swarm in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button className="gap-2">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline">Full Documentation</Button>
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
