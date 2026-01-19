'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, CheckCircle, XCircle, Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ToolExecution } from '@/hooks/use-ai-response'

interface ToolExecutionIndicatorProps {
  execution: ToolExecution
  onDismiss?: () => void
  compact?: boolean
}

export function ToolExecutionIndicator({ execution, onDismiss, compact = false }: ToolExecutionIndicatorProps) {
  const [expanded, setExpanded] = useState(false)

  const statusIcon = {
    pending: <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />,
    running: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
  }

  const statusColors = {
    pending: 'border-muted bg-muted/30',
    running: 'border-blue-500/50 bg-blue-500/10',
    success: 'border-green-500/50 bg-green-500/10',
    error: 'border-red-500/50 bg-red-500/10',
  }

  const statusText = {
    pending: 'Preparing...',
    running: 'Executing...',
    success: 'Completed',
    error: 'Failed',
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm',
          statusColors[execution.status]
        )}
      >
        {statusIcon[execution.status]}
        <span className="font-medium">{execution.toolName}</span>
        <span className="text-muted-foreground">{statusText[execution.status]}</span>
        {execution.executionTimeMs && (
          <Badge variant="outline" className="text-xs">
            {execution.executionTimeMs}ms
          </Badge>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={cn('border transition-colors', statusColors[execution.status])}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/50">
              <Wrench className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{execution.toolName}</span>
                {execution.executionTimeMs && (
                  <Badge variant="outline" className="text-xs">
                    {execution.executionTimeMs}ms
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                {statusIcon[execution.status]}
                <span>{statusText[execution.status]}</span>
                {execution.error && (
                  <span className="text-red-500 truncate">- {execution.error}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(execution.input !== undefined || execution.output !== undefined) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              )}
              {onDismiss && execution.status !== 'running' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={onDismiss}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {execution.input && typeof execution.input === 'object' && Object.keys(execution.input as object).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
                      <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-32">
                        {JSON.stringify(execution.input, null, 2)}
                      </pre>
                    </div>
                  )}
                  {execution.output !== undefined && execution.output !== null && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                      <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-32">
                        {typeof execution.output === 'string'
                          ? execution.output
                          : JSON.stringify(execution.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface ToolExecutionListProps {
  executions: ToolExecution[]
  maxVisible?: number
}

export function ToolExecutionList({ executions, maxVisible = 3 }: ToolExecutionListProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleExecutions = showAll ? executions : executions.slice(0, maxVisible)
  const hiddenCount = executions.length - maxVisible

  if (executions.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Wrench className="w-3 h-3" />
          Recent Tool Executions
        </h4>
        {hiddenCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show less' : `+${hiddenCount} more`}
          </Button>
        )}
      </div>
      <AnimatePresence>
        {visibleExecutions.map((execution, index) => (
          <motion.div
            key={`${execution.toolId}-${execution.startedAt.getTime()}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
          >
            <ToolExecutionIndicator execution={execution} compact />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
