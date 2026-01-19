'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { cn } from '@/lib/utils'
import { docsNavigation, getDocContent } from '@/lib/docs-content'

interface TableOfContentsItem {
  id: string
  title: string
  level: number
}

function extractHeadings(markdown: string): TableOfContentsItem[] {
  const headings: TableOfContentsItem[] = []
  const lines = markdown.split('\n')

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const title = match[2].trim()
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      headings.push({ id, title, level })
    }
  }

  return headings
}

function MarkdownRenderer({ content }: { content: string }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeContent = ''
    let codeLanguage = ''
    let inTable = false
    let tableRows: string[][] = []
    let listItems: { level: number; content: string; ordered: boolean }[] = []
    let inList = false

    const processInlineFormatting = (line: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = []
      let remaining = line
      let keyIndex = 0

      while (remaining.length > 0) {
        const codeMatch = remaining.match(/`([^`]+)`/)
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
        const italicMatch = remaining.match(/\*([^*]+)\*/)
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)

        const matches = [
          codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index || 0 } : null,
          boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index || 0 } : null,
          italicMatch ? { type: 'italic', match: italicMatch, index: italicMatch.index || 0 } : null,
          linkMatch ? { type: 'link', match: linkMatch, index: linkMatch.index || 0 } : null,
        ].filter(Boolean).sort((a, b) => (a?.index || 0) - (b?.index || 0))

        if (matches.length === 0) {
          parts.push(remaining)
          break
        }

        const first = matches[0]!
        const { type, match } = first

        if (match.index && match.index > 0) {
          parts.push(remaining.substring(0, match.index))
        }

        if (type === 'code') {
          parts.push(
            <code key={keyIndex++} className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">
              {match[1]}
            </code>
          )
        } else if (type === 'bold') {
          parts.push(<strong key={keyIndex++}>{match[1]}</strong>)
        } else if (type === 'italic') {
          parts.push(<em key={keyIndex++}>{match[1]}</em>)
        } else if (type === 'link') {
          const href = match[2]
          const isExternal = href.startsWith('http')
          parts.push(
            isExternal ? (
              <a
                key={keyIndex++}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {match[1]}
              </a>
            ) : (
              <Link key={keyIndex++} href={href} className="text-primary hover:underline">
                {match[1]}
              </Link>
            )
          )
        }

        remaining = remaining.substring((match.index || 0) + match[0].length)
      }

      return parts
    }

    const flushList = () => {
      if (listItems.length > 0) {
        const isOrdered = listItems[0].ordered
        const ListComponent = isOrdered ? 'ol' : 'ul'
        elements.push(
          <ListComponent
            key={elements.length}
            className={cn(
              'my-4 space-y-2',
              isOrdered ? 'list-decimal list-inside' : 'list-disc list-inside'
            )}
          >
            {listItems.map((item, idx) => (
              <li key={idx} className="text-muted-foreground" style={{ marginLeft: (item.level - 1) * 16 }}>
                {processInlineFormatting(item.content)}
              </li>
            ))}
          </ListComponent>
        )
        listItems = []
        inList = false
      }
    }

    const flushTable = () => {
      if (tableRows.length > 0) {
        const [header, ...rows] = tableRows
        elements.push(
          <div key={elements.length} className="my-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  {header.map((cell, idx) => (
                    <th key={idx} className="text-left p-3 font-semibold bg-muted/50">
                      {processInlineFormatting(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.filter(row => !row.every(cell => cell.match(/^-+$/))).map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b last:border-0">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="p-3 text-muted-foreground">
                        {processInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        tableRows = []
        inTable = false
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushList()
          elements.push(
            <div key={elements.length} className="relative my-4 group">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyCode(codeContent.trim())}
              >
                {copiedCode === codeContent.trim() ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
                <code className={`text-sm font-mono language-${codeLanguage}`}>
                  {codeContent.trim()}
                </code>
              </pre>
            </div>
          )
          codeContent = ''
          codeLanguage = ''
          inCodeBlock = false
        } else {
          flushList()
          flushTable()
          inCodeBlock = true
          codeLanguage = line.slice(3).trim() || 'text'
        }
        continue
      }

      if (inCodeBlock) {
        codeContent += line + '\n'
        continue
      }

      if (line.startsWith('|') && line.endsWith('|')) {
        flushList()
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim())
        tableRows.push(cells)
        inTable = true
        continue
      } else if (inTable) {
        flushTable()
      }

      const unorderedMatch = line.match(/^(\s*)[-*]\s+(.+)$/)
      const orderedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/)

      if (unorderedMatch || orderedMatch) {
        const match = unorderedMatch || orderedMatch
        const indent = match![1].length
        const level = Math.floor(indent / 2) + 1
        const content = match![2]
        listItems.push({ level, content, ordered: !!orderedMatch })
        inList = true
        continue
      } else if (inList) {
        flushList()
      }

      if (line.startsWith('# ')) {
        flushList()
        flushTable()
        const title = line.slice(2)
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        elements.push(
          <h1 key={elements.length} id={id} className="text-3xl font-bold mt-8 mb-4 first:mt-0 scroll-mt-20">
            {processInlineFormatting(title)}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        flushList()
        flushTable()
        const title = line.slice(3)
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        elements.push(
          <h2 key={elements.length} id={id} className="text-2xl font-bold mt-8 mb-3 scroll-mt-20">
            {processInlineFormatting(title)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        flushList()
        flushTable()
        const title = line.slice(4)
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        elements.push(
          <h3 key={elements.length} id={id} className="text-xl font-semibold mt-6 mb-2 scroll-mt-20">
            {processInlineFormatting(title)}
          </h3>
        )
      } else if (line.startsWith('#### ')) {
        flushList()
        flushTable()
        const title = line.slice(5)
        elements.push(
          <h4 key={elements.length} className="text-lg font-semibold mt-4 mb-2">
            {processInlineFormatting(title)}
          </h4>
        )
      } else if (line.trim() === '') {
        continue
      } else {
        elements.push(
          <p key={elements.length} className="text-muted-foreground leading-7 mb-4">
            {processInlineFormatting(line)}
          </p>
        )
      }
    }

    flushList()
    flushTable()

    return elements
  }

  return <div className="prose prose-slate dark:prose-invert max-w-none">{renderMarkdown(content)}</div>
}

function TableOfContents({ headings, activeId }: { headings: TableOfContentsItem[]; activeId: string }) {
  if (headings.length === 0) return null

  return (
    <nav className="space-y-1">
      <p className="font-semibold text-sm mb-3">On this page</p>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className={cn(
            'block text-sm py-1 transition-colors hover:text-foreground',
            heading.level === 2 ? 'pl-0' : heading.level === 3 ? 'pl-3' : 'pl-6',
            activeId === heading.id ? 'text-primary font-medium' : 'text-muted-foreground'
          )}
        >
          {heading.title}
        </a>
      ))}
    </nav>
  )
}

export default function DocPage() {
  const params = useParams()
  const section = params.section as string
  const slug = params.slug as string

  const [activeHeading, setActiveHeading] = useState('')

  const sectionData = docsNavigation.find((s) => s.slug === section)
  const currentItemIndex = sectionData?.items.findIndex((item) => item.slug === slug) ?? -1
  const currentItem = sectionData?.items[currentItemIndex]
  const content = getDocContent(slug)

  const headings = content ? extractHeadings(content) : []

  const prevItem = currentItemIndex > 0 ? sectionData?.items[currentItemIndex - 1] : null
  const nextItem =
    currentItemIndex < (sectionData?.items.length ?? 0) - 1
      ? sectionData?.items[currentItemIndex + 1]
      : null

  let prevSection = null
  let nextSection = null

  if (!prevItem) {
    const currentSectionIndex = docsNavigation.findIndex((s) => s.slug === section)
    if (currentSectionIndex > 0) {
      const prev = docsNavigation[currentSectionIndex - 1]
      prevSection = { section: prev, item: prev.items[prev.items.length - 1] }
    }
  }

  if (!nextItem) {
    const currentSectionIndex = docsNavigation.findIndex((s) => s.slug === section)
    if (currentSectionIndex < docsNavigation.length - 1) {
      const next = docsNavigation[currentSectionIndex + 1]
      nextSection = { section: next, item: next.items[0] }
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  if (!content || !currentItem) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The documentation page you're looking for doesn't exist.
        </p>
        <Link href="/docs">
          <Button>Back to Documentation</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 min-w-0 px-6 py-8 lg:px-12"
      >
        <div className="max-w-3xl">
          <Breadcrumbs
            customItems={[
              { label: 'Documentation', href: '/docs' },
              { label: sectionData?.title || section, href: `/docs/${section}/${sectionData?.items[0]?.slug || ''}` },
              { label: currentItem.title, href: `/docs/${section}/${slug}` },
            ]}
            className="mb-6"
          />
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-1">{sectionData?.title}</p>
            <h1 className="text-3xl font-bold">{currentItem.title}</h1>
          </div>

          <MarkdownRenderer content={content} />

          <div className="mt-12 pt-8 border-t flex items-center justify-between">
            <div>
              {prevItem ? (
                <Link
                  href={`/docs/${section}/${prevItem.slug}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <div>
                    <p className="text-xs text-muted-foreground">Previous</p>
                    <p className="font-medium">{prevItem.title}</p>
                  </div>
                </Link>
              ) : prevSection ? (
                <Link
                  href={`/docs/${prevSection.section.slug}/${prevSection.item.slug}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <div>
                    <p className="text-xs text-muted-foreground">{prevSection.section.title}</p>
                    <p className="font-medium">{prevSection.item.title}</p>
                  </div>
                </Link>
              ) : null}
            </div>

            <div className="text-right">
              {nextItem ? (
                <Link
                  href={`/docs/${section}/${nextItem.slug}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">Next</p>
                    <p className="font-medium">{nextItem.title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : nextSection ? (
                <Link
                  href={`/docs/${nextSection.section.slug}/${nextSection.item.slug}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">{nextSection.section.title}</p>
                    <p className="font-medium">{nextSection.item.title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>

      <aside className="hidden xl:block w-64 shrink-0">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] py-8 pr-6">
          <ScrollArea className="h-full">
            <TableOfContents headings={headings} activeId={activeHeading} />
          </ScrollArea>
        </div>
      </aside>
    </div>
  )
}
