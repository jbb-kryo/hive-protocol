'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Hexagon, Bot, MessageSquare, Loader2, Search } from 'lucide-react'
import { useGlobalSearch, SearchResult, SearchResultType } from '@/hooks/use-global-search'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface GlobalSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const iconMap = {
  swarm: Hexagon,
  agent: Bot,
  message: MessageSquare,
}

const colorMap = {
  swarm: 'text-blue-500',
  agent: 'text-green-500',
  message: 'text-purple-500',
}

const categoryLabels = {
  swarms: 'Swarms',
  agents: 'Agents',
  messages: 'Messages',
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { results, loading, error, hasResults } = useGlobalSearch(query, open)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const allResults: SearchResult[] = [
    ...results.swarms,
    ...results.agents,
    ...results.messages,
  ]

  const handleSelect = (result: SearchResult) => {
    router.push(result.url)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault()
      handleSelect(allResults[selectedIndex])
    }
  }

  const ResultIcon = ({ type }: { type: SearchResultType }) => {
    const Icon = iconMap[type]
    return <Icon className={cn('w-4 h-4', colorMap[type])} />
  }

  const ResultItem = ({ result, index }: { result: SearchResult; index: number }) => {
    const isSelected = index === selectedIndex

    return (
      <CommandItem
        key={result.id}
        onSelect={() => handleSelect(result)}
        className={cn(
          'flex items-start gap-3 px-4 py-3 cursor-pointer',
          isSelected && 'bg-accent'
        )}
      >
        <ResultIcon type={result.type} />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{result.title}</div>
          {result.description && (
            <div className="text-sm text-muted-foreground truncate">
              {result.description}
            </div>
          )}
          {result.metadata?.timestamp && (
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(result.metadata.timestamp), { addSuffix: true })}
            </div>
          )}
        </div>
      </CommandItem>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl max-h-[600px] overflow-hidden">
        <Command onKeyDown={handleKeyDown} shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <CommandInput
              placeholder="Search swarms, agents, and messages..."
              value={query}
              onValueChange={setQuery}
              className="border-0 focus:ring-0"
            />
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <CommandList className="max-h-[500px]">
            {!query ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Type to search across swarms, agents, and messages</p>
                <div className="mt-4 text-xs">
                  <p>Use ↑↓ to navigate</p>
                  <p>Press Enter to open</p>
                  <p>Press Esc to close</p>
                </div>
              </div>
            ) : loading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Searching...</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-sm text-red-500">
                <p>{error}</p>
              </div>
            ) : !hasResults ? (
              <CommandEmpty>
                <div className="py-12 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    No results found for &quot;{query}&quot;
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Try a different search term
                  </p>
                </div>
              </CommandEmpty>
            ) : (
              <>
                {results.swarms.length > 0 && (
                  <>
                    <CommandGroup heading={categoryLabels.swarms}>
                      {results.swarms.map((result, index) => (
                        <ResultItem key={result.id} result={result} index={index} />
                      ))}
                    </CommandGroup>
                    {(results.agents.length > 0 || results.messages.length > 0) && (
                      <CommandSeparator />
                    )}
                  </>
                )}

                {results.agents.length > 0 && (
                  <>
                    <CommandGroup heading={categoryLabels.agents}>
                      {results.agents.map((result, index) => (
                        <ResultItem
                          key={result.id}
                          result={result}
                          index={results.swarms.length + index}
                        />
                      ))}
                    </CommandGroup>
                    {results.messages.length > 0 && <CommandSeparator />}
                  </>
                )}

                {results.messages.length > 0 && (
                  <CommandGroup heading={categoryLabels.messages}>
                    {results.messages.map((result, index) => (
                      <ResultItem
                        key={result.id}
                        result={result}
                        index={results.swarms.length + results.agents.length + index}
                      />
                    ))}
                  </CommandGroup>
                )}

                <div className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                  Found {results.total} result{results.total !== 1 ? 's' : ''} across{' '}
                  {[
                    results.swarms.length > 0 && 'swarms',
                    results.agents.length > 0 && 'agents',
                    results.messages.length > 0 && 'messages',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
