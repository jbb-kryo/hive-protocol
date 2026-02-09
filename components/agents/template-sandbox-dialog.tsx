'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Send, X, Loader2, User, FlaskConical, Square,
  RotateCcw, Clock, AlertCircle, History, ChevronRight,
  Variable, Maximize2, Minimize2, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  useTemplateSandbox,
  type SandboxConfig,
  type TestMessage,
  type TestConversation,
} from '@/hooks/use-template-sandbox'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface TemplateSandboxDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: SandboxConfig | null
  compareConfig?: SandboxConfig | null
}

function SandboxMessageBubble({ message }: { message: TestMessage }) {
  const isUser = message.role === 'user'
  const isError = !!(message.metadata as Record<string, unknown>)?.is_error

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex gap-2.5 px-4 py-2.5',
        isUser ? 'flex-row-reverse' : ''
      )}
    >
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-medium',
        isUser
          ? 'bg-slate-200 dark:bg-slate-700'
          : isError
            ? 'bg-red-500/15'
            : 'bg-teal-500/15'
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          : isError
            ? <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            : <Bot className="w-3.5 h-3.5 text-teal-600" />
        }
      </div>
      <div className={cn(
        'flex-1 min-w-0',
        isUser ? 'text-right' : ''
      )}>
        <div className={cn(
          'inline-block rounded-xl px-3.5 py-2.5 text-sm max-w-[85%] text-left',
          isUser
            ? 'bg-slate-100 dark:bg-slate-800'
            : isError
              ? 'bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-300'
              : 'bg-muted/50 border border-border'
        )}>
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        </div>
        <div className={cn(
          'flex items-center gap-2 mt-1',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.response_time_ms && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {message.response_time_ms}ms
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ChatPane({
  config,
  label,
  showLabel,
}: {
  config: SandboxConfig
  label: string
  showLabel: boolean
}) {
  const {
    conversation,
    messages,
    sending,
    error,
    startConversation,
    sendMessage,
    endConversation,
    cancelResponse,
    clearMessages,
    fetchTestHistory,
  } = useTemplateSandbox()

  const [input, setInput] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<TestConversation[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    startConversation(config).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setInput('')
    await sendMessage(trimmed, config)
  }, [input, sending, sendMessage, config])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleLoadHistory = useCallback(async () => {
    setHistoryOpen(!historyOpen)
    if (!historyOpen) {
      setHistoryLoading(true)
      const results = await fetchTestHistory(
        config.template_id || undefined,
        config.default_agent_id || undefined
      )
      setHistory(results)
      setHistoryLoading(false)
    }
  }, [historyOpen, fetchTestHistory, config])

  const handleReset = useCallback(async () => {
    await endConversation()
    clearMessages()
    await startConversation(config)
  }, [endConversation, clearMessages, startConversation, config])

  return (
    <div className="flex flex-col h-full">
      {showLabel && (
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
      )}

      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-teal-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{config.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {config.framework} {config.role ? `/ ${config.role}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleLoadHistory}
                >
                  <History className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Test history</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Reset conversation</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="p-3 bg-muted/20 max-h-[200px] overflow-y-auto">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Previous Tests</p>
              {historyLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No previous tests</p>
              ) : (
                <div className="space-y-1.5">
                  {history.map(conv => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between rounded-md border border-border bg-background px-2.5 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {conv.status === 'completed' ? 'Completed' : conv.status}
                          {conv.template_version && ` - v${conv.template_version}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">
                        {conv.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
              <FlaskConical className="w-7 h-7 text-teal-500/60" />
            </div>
            <p className="text-sm font-medium mb-1">Template Sandbox</p>
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              Send a message to test how this template responds. Test usage is logged separately.
            </p>
            {config.system_prompt && (
              <details className="mt-4 text-left w-full max-w-sm">
                <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  View system prompt
                </summary>
                <div className="mt-2 p-2 rounded-md bg-muted/50 border border-border text-[11px] text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {config.system_prompt}
                </div>
              </details>
            )}
          </div>
        ) : (
          <div className="py-3">
            <AnimatePresence>
              {messages.map(msg => (
                <SandboxMessageBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
            {sending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2.5 px-4 py-2.5"
              >
                <div className="w-7 h-7 rounded-full bg-teal-500/15 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-teal-600" />
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {error && !messages.some(m => (m.metadata as Record<string, unknown>)?.is_error) && (
        <div className="px-4 py-2 border-t border-red-500/20 bg-red-500/5">
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {error}
          </p>
        </div>
      )}

      <div className="px-4 py-3 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a test message..."
            rows={1}
            className="min-h-[38px] max-h-[120px] resize-none text-sm"
            disabled={sending || !conversation}
          />
          {sending ? (
            <Button
              variant="outline"
              size="icon"
              className="h-[38px] w-[38px] shrink-0"
              onClick={cancelResponse}
            >
              <Square className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-[38px] w-[38px] shrink-0 bg-teal-600 hover:bg-teal-700"
              onClick={handleSend}
              disabled={!input.trim() || !conversation}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className="text-[9px] gap-1 border-amber-500/20 text-amber-600">
            <FlaskConical className="w-2.5 h-2.5" />
            Sandbox Mode
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

export function TemplateSandboxDialog({
  open,
  onOpenChange,
  config,
  compareConfig,
}: TemplateSandboxDialogProps) {
  const [expanded, setExpanded] = useState(false)
  const isComparing = !!compareConfig

  if (!config) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col p-0 gap-0 overflow-hidden',
          isComparing
            ? 'sm:max-w-5xl h-[85vh]'
            : expanded
              ? 'sm:max-w-3xl h-[85vh]'
              : 'sm:max-w-lg h-[70vh]'
        )}
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-sm">Template Sandbox</DialogTitle>
              <DialogDescription className="text-[10px]">
                {isComparing
                  ? 'Compare responses side by side'
                  : 'Test template behavior before publishing'
                }
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isComparing && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{expanded ? 'Compact view' : 'Expanded view'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <div className={cn(
          'flex-1 min-h-0',
          isComparing ? 'grid grid-cols-2 divide-x divide-border' : ''
        )}>
          <ChatPane
            config={config}
            label={isComparing ? 'Current Version' : 'Test'}
            showLabel={isComparing}
          />
          {isComparing && compareConfig && (
            <ChatPane
              config={compareConfig}
              label="Previous Version"
              showLabel
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
