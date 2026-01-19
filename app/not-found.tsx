'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { FileQuestion, Home, Search, ArrowLeft, BookOpen, MessageSquare, HelpCircle, ArrowRight, Bug, Sparkles, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { logWarn } from '@/lib/error-logger'

export default function NotFound() {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    logWarn('404 Page Not Found', {
      attemptedPath: pathname,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    })
  }, [pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/docs?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const popularPages = [
    { href: '/docs', label: 'Documentation', description: 'Learn how to use HIVE', icon: BookOpen },
    { href: '/agents', label: 'AI Agents', description: 'Build and manage agents', icon: Sparkles },
    { href: '/swarms', label: 'Swarms', description: 'Orchestrate multi-agent teams', icon: Users },
    { href: '/marketplace', label: 'Marketplace', description: 'Discover pre-built agents', icon: Zap },
  ]

  const quickLinks = [
    { href: '/docs/getting-started/quick-start', label: 'Quick Start Guide' },
    { href: '/docs/api/reference', label: 'API Reference' },
    { href: '/pricing', label: 'Pricing Plans' },
    { href: '/blog', label: 'Latest Updates' },
  ]

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted mb-6">
            <FileQuestion className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Page Not Found</h1>
          <p className="text-lg text-muted-foreground mb-1">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <p className="text-sm text-muted-foreground">
            The page may have been moved, deleted, or never existed.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8 sm:mb-10">
          <div className="flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={!searchQuery.trim()}>
              Search
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-3 mb-8 sm:mb-10">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8 sm:mb-10">
          <h2 className="text-lg font-semibold mb-4 text-center">Popular Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {popularPages.map((page) => {
              const Icon = page.icon
              return (
                <Link key={page.href} href={page.href}>
                  <Card className="h-full hover:border-primary/50 hover:shadow-sm transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        {page.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{page.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 sm:p-6 mb-8">
          <h3 className="text-sm font-medium mb-3">Quick Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 py-1"
              >
                <ArrowRight className="h-3 w-3" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Still can't find what you're looking for?
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/docs" className="text-sm text-primary hover:underline flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Browse Documentation
            </Link>
            <Link href="/contact" className="text-sm text-primary hover:underline flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </Link>
            <Link href="/status" className="text-sm text-primary hover:underline flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              System Status
            </Link>
            <Link
              href={`/contact?subject=${encodeURIComponent('Broken Link Report')}&message=${encodeURIComponent(`I encountered a 404 error at: ${pathname}`)}`}
              className="text-sm text-primary hover:underline flex items-center gap-1.5"
            >
              <Bug className="h-4 w-4" />
              Report Broken Link
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
