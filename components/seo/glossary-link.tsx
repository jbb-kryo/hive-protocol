'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getTermBySlug } from '@/lib/glossary-data'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface GlossaryLinkProps {
  term: string
  children?: React.ReactNode
  className?: string
  showTooltip?: boolean
}

export function GlossaryLink({
  term,
  children,
  className,
  showTooltip = true,
}: GlossaryLinkProps) {
  const glossaryTerm = getTermBySlug(term)

  if (!glossaryTerm) {
    return <span className={className}>{children || term}</span>
  }

  const linkContent = (
    <Link
      href={`/glossary/${glossaryTerm.slug}`}
      className={cn(
        'text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all',
        className
      )}
    >
      {children || glossaryTerm.term}
    </Link>
  )

  if (!showTooltip) {
    return linkContent
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium mb-1">{glossaryTerm.term}</p>
          <p className="text-xs text-muted-foreground">{glossaryTerm.shortDefinition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface GlossaryTextProps {
  children: string
  className?: string
}

const termMappings: { [key: string]: string } = {
  'ai agent': 'ai-agent',
  'ai agents': 'ai-agent',
  'artificial intelligence': 'artificial-intelligence',
  llm: 'llm',
  llms: 'llm',
  'large language model': 'llm',
  'large language models': 'llm',
  transformer: 'transformer',
  transformers: 'transformer',
  'neural network': 'neural-network',
  'neural networks': 'neural-network',
  embedding: 'embedding',
  embeddings: 'embedding',
  'multi-agent': 'multi-agent-system',
  'multi-agent system': 'multi-agent-system',
  swarm: 'swarm',
  swarms: 'swarm',
  rag: 'rag',
  'retrieval-augmented generation': 'rag',
  'prompt engineering': 'prompt-engineering',
  'fine-tuning': 'fine-tuning',
  'fine tuning': 'fine-tuning',
  hallucination: 'hallucination',
  hallucinations: 'hallucination',
  token: 'token',
  tokens: 'token',
  'context window': 'context-window',
  'human-in-the-loop': 'human-in-the-loop',
  hitl: 'human-in-the-loop',
  'tool use': 'tool-use',
  'function calling': 'tool-use',
  'chain of thought': 'chain-of-thought',
  cot: 'chain-of-thought',
  'zero-shot': 'zero-shot-learning',
  'few-shot': 'few-shot-learning',
  temperature: 'temperature',
  'vector database': 'vector-database',
  'semantic search': 'semantic-search',
}

export function GlossaryText({ children, className }: GlossaryTextProps) {
  const parts: (string | React.ReactNode)[] = []
  let remainingText = children
  let key = 0

  const sortedTerms = Object.entries(termMappings).sort(
    ([a], [b]) => b.length - a.length
  )

  while (remainingText.length > 0) {
    let found = false

    for (const [phrase, slug] of sortedTerms) {
      const regex = new RegExp(`\\b${phrase}\\b`, 'i')
      const match = remainingText.match(regex)

      if (match && match.index !== undefined) {
        if (match.index > 0) {
          parts.push(remainingText.slice(0, match.index))
        }

        parts.push(
          <GlossaryLink key={key++} term={slug}>
            {match[0]}
          </GlossaryLink>
        )

        remainingText = remainingText.slice(match.index + match[0].length)
        found = true
        break
      }
    }

    if (!found) {
      parts.push(remainingText)
      break
    }
  }

  return <span className={className}>{parts}</span>
}
