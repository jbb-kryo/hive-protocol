'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Hexagon,
  Sparkles,
  Zap,
  Bug,
  AlertTriangle,
  Calendar,
  Rss,
  ChevronDown,
  ChevronUp,
  Tag,
  Loader2,
  ArrowLeft,
  Filter,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'

interface ChangelogVersion {
  id: string
  version: string
  title: string
  description: string
  released_at: string
  is_major: boolean
  entries: ChangelogEntry[]
}

interface ChangelogEntry {
  id: string
  category: 'new_feature' | 'improvement' | 'bug_fix' | 'breaking_change'
  title: string
  description: string
  order_index: number
}

const categoryConfig = {
  new_feature: {
    label: 'New Feature',
    icon: Sparkles,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  improvement: {
    label: 'Improvement',
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  bug_fix: {
    label: 'Bug Fix',
    icon: Bug,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  breaking_change: {
    label: 'Breaking Change',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
}

export default function ChangelogPage() {
  const [versions, setVersions] = useState<ChangelogVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(
    new Set(['new_feature', 'improvement', 'bug_fix', 'breaking_change'])
  )

  useEffect(() => {
    fetchChangelog()
  }, [])

  useEffect(() => {
    if (versions.length > 0) {
      setExpandedVersions(new Set([versions[0].id]))
    }
  }, [versions])

  const fetchChangelog = async () => {
    try {
      const { data: versionsData } = await supabase
        .from('changelog_versions')
        .select('*')
        .order('released_at', { ascending: false })

      if (versionsData) {
        const versionsWithEntries = await Promise.all(
          versionsData.map(async (version) => {
            const { data: entries } = await supabase
              .from('changelog_entries')
              .select('*')
              .eq('version_id', version.id)
              .order('order_index')

            return { ...version, entries: entries || [] }
          })
        )
        setVersions(versionsWithEntries)
      }
    } catch (error) {
      console.error('Failed to fetch changelog:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVersion = (id: string) => {
    setExpandedVersions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleCategory = (category: string) => {
    setCategoryFilters((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const filteredVersions = versions.map((version) => ({
    ...version,
    entries: version.entries.filter((entry) => categoryFilters.has(entry.category)),
  }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Hexagon className="h-6 w-6 text-primary fill-primary/20" />
            <span className="font-bold">HIVE Changelog</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/changelog/rss.xml" target="_blank">
              <Button variant="ghost" size="sm" className="gap-2">
                <Rss className="w-4 h-4" />
                <span className="hidden sm:inline">RSS Feed</span>
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Tag className="w-4 h-4" />
            Product Updates
          </div>
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay up to date with all the latest features, improvements, and fixes to HIVE Protocol.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon
              const isActive = categoryFilters.has(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? `${config.bgColor} ${config.color}`
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              )
            })}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(categoryConfig).map(([key, config]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={categoryFilters.has(key)}
                  onCheckedChange={() => toggleCategory(key)}
                >
                  <span className={config.color}>{config.label}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        <div className="relative">
          <div className="absolute left-4 md:left-8 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-8">
            {filteredVersions.map((version, index) => {
              const isExpanded = expandedVersions.has(version.id)
              const hasVisibleEntries = version.entries.length > 0

              return (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-10 md:pl-16"
                >
                  <div
                    className={`absolute left-2 md:left-6 w-4 h-4 rounded-full border-2 bg-background ${
                      version.is_major
                        ? 'border-primary bg-primary'
                        : 'border-border'
                    }`}
                  />

                  <Card
                    className={`overflow-hidden transition-all ${
                      version.is_major ? 'border-primary/30' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleVersion(version.id)}
                      className="w-full text-left"
                    >
                      <div className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge
                              variant={version.is_major ? 'default' : 'secondary'}
                              className={version.is_major ? 'bg-primary' : ''}
                            >
                              v{version.version}
                            </Badge>
                            {version.is_major && (
                              <Badge variant="outline" className="text-primary border-primary/30">
                                Major Release
                              </Badge>
                            )}
                          </div>
                          <h2 className="text-xl font-semibold">{version.title}</h2>
                          {version.description && (
                            <p className="text-muted-foreground mt-1 text-sm">
                              {version.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(version.released_at), 'MMM d, yyyy')}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && hasVisibleEntries && (
                      <CardContent className="pt-0 pb-6 px-4 md:px-6">
                        <div className="border-t pt-4 space-y-3">
                          {version.entries.map((entry) => {
                            const config = categoryConfig[entry.category]
                            const Icon = config.icon

                            return (
                              <div
                                key={entry.id}
                                className={`flex gap-3 p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}
                              >
                                <div className={`shrink-0 ${config.color}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-xs font-medium ${config.color}`}>
                                      {config.label}
                                    </span>
                                  </div>
                                  <p className="font-medium mt-0.5">{entry.title}</p>
                                  {entry.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {entry.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    )}

                    {isExpanded && !hasVisibleEntries && (
                      <CardContent className="pt-0 pb-6 px-4 md:px-6">
                        <div className="border-t pt-4 text-center text-muted-foreground">
                          No entries match the current filter.
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>

        {versions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No changelog entries yet.</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-muted/30">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Rss className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Subscribe to Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new releases and important updates via RSS.
                  </p>
                </div>
                <Link href="/changelog/rss.xml" target="_blank">
                  <Button className="gap-2 shrink-0">
                    <Rss className="w-4 h-4" />
                    Subscribe via RSS
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <footer className="mt-12 pt-8 border-t text-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Hexagon className="h-5 w-5 text-primary fill-primary/20" />
            <span className="font-semibold">HIVE Protocol</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Building the future of AI collaboration
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="/status"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              System Status
            </Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
