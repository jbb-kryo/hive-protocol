'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Book,
  Bot,
  Network,
  Brain,
  Puzzle,
  Code,
  Terminal,
  Shield,
  Search,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
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

interface SearchResult {
  section: string
  item: string
  slug: string
  title: string
  excerpt: string
}

function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  useEffect(() => {
    const currentSection = docsNavigation.find((section) =>
      section.items.some((item) => pathname === `/docs/${section.slug}/${item.slug}`)
    )
    if (currentSection && !expandedSections.includes(currentSection.id)) {
      setExpandedSections((prev) => [...prev, currentSection.id])
    }
  }, [pathname])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  return (
    <nav className="space-y-1">
      {docsNavigation.map((section) => {
        const Icon = iconMap[section.icon] || Book
        const isExpanded = expandedSections.includes(section.id)
        const isActive = section.items.some(
          (item) => pathname === `/docs/${section.slug}/${item.slug}`
        )

        return (
          <div key={section.id}>
            <button
              onClick={() => toggleSection(section.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{section.title}</span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-6 mt-1 space-y-1 border-l pl-3">
                    {section.items.map((item) => {
                      const itemPath = `/docs/${section.slug}/${item.slug}`
                      const itemActive = pathname === itemPath

                      return (
                        <Link
                          key={item.id}
                          href={itemPath}
                          onClick={onNavigate}
                          className={cn(
                            'block px-3 py-1.5 rounded text-sm transition-colors',
                            itemActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          {item.title}
                        </Link>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </nav>
  )
}

function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (value.length >= 2) {
      const searchResults = searchDocs(value)
      setResults(searchResults)
    } else {
      setResults([])
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Documentation</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search documentation..."
            className="border-0 focus-visible:ring-0 px-0 text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>
        <ScrollArea className="max-h-[400px]">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((result, index) => (
                <Link
                  key={`${result.section}-${result.slug}-${index}`}
                  href={`/docs/${docsNavigation.find((s) => s.title === result.section)?.slug}/${result.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="block p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{result.section}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium">{result.title}</span>
                  </div>
                  {result.excerpt && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {result.excerpt}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>Type at least 2 characters to search</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export function DocsClientLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-4 border-b">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                  HIVE
                </Link>
              </div>
              <ScrollArea className="flex-1 p-4">
                <DocsSidebar onNavigate={() => setSidebarOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-bold text-xl">HIVE</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronRight className="w-4 h-4" />
            <span>Documentation</span>
          </div>

          <div className="flex-1" />

          <Button
            variant="outline"
            className="w-64 justify-start text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4 mr-2" />
            <span>Search docs...</span>
            <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">Cmd</span>K
            </kbd>
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-72 border-r shrink-0">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <ScrollArea className="h-full p-4">
              <DocsSidebar />
            </ScrollArea>
          </div>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
