'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Brain,
  User,
  Copy,
  RefreshCw,
  Flag,
  Info,
  Check,
  ShieldX,
  Loader2,
  FileKey,
  HelpCircle,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import type { Message, SignatureStatus } from '@/lib/supabase'
import { getAgentColor } from '@/lib/demo-engine'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import { supabase } from '@/lib/supabase'

interface MessageBubbleProps {
  message: Message
  onRegenerate?: (message: Message) => void
  onFlag?: (message: Message) => void
  onViewMetadata?: (message: Message) => void
  isRegenerating?: boolean
  showSignatureDetails?: boolean
  verificationEnabled?: boolean
  onVerificationComplete?: (messageId: string, status: SignatureStatus) => void
}

interface SignatureInfo {
  icon: typeof ShieldCheck
  color: string
  bgColor: string
  borderColor: string
  label: string
  description: string
  learnMore: string
}

function getSignatureInfo(
  status?: SignatureStatus,
  verified?: boolean,
  error?: string
): SignatureInfo {
  if (status === 'verified' || (verified && !status)) {
    return {
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      label: 'Verified',
      description: 'This message has been cryptographically verified. The content is authentic and has not been modified since it was sent by the agent.',
      learnMore: 'Message signatures use HMAC-SHA256 to create a unique fingerprint of the message content. When verified, you can be confident the message is exactly as the agent sent it.',
    }
  }
  if (status === 'tampered') {
    return {
      icon: ShieldX,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      label: 'Tampered',
      description: error || 'The signature for this message does not match. The message content may have been modified after it was sent.',
      learnMore: 'A tampered message indicates that the content has changed since it was signed. This could indicate unauthorized modification or data corruption.',
    }
  }
  if (status === 'invalid') {
    return {
      icon: ShieldAlert,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      label: 'Invalid',
      description: error || 'The signature for this message is invalid or could not be verified.',
      learnMore: 'An invalid signature may indicate a technical issue with the signing process or that the signing key is no longer available.',
    }
  }
  if (status === 'signed') {
    return {
      icon: ShieldCheck,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      label: 'Signed',
      description: 'This message has a cryptographic signature but has not yet been verified.',
      learnMore: 'Click "Verify Now" to check that the message content matches its signature and confirm authenticity.',
    }
  }
  return {
    icon: ShieldQuestion,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-border',
    label: 'Unsigned',
    description: 'This message has no cryptographic signature. Human messages are not signed by default.',
    learnMore: 'Only agent messages are automatically signed. Human messages do not require signatures as they are sent directly by authenticated users.',
  }
}

function VerificationBadge({
  status,
  verified,
  error,
  showDetails = false,
  onVerify,
  isVerifying = false,
  verificationEnabled = true,
}: {
  status?: SignatureStatus
  verified?: boolean
  error?: string
  showDetails?: boolean
  onVerify?: () => void
  isVerifying?: boolean
  verificationEnabled?: boolean
}) {
  const info = getSignatureInfo(status, verified, error)
  const Icon = info.icon
  const canVerify = status === 'signed' && onVerify && verificationEnabled

  if (showDetails) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              'gap-1.5 text-xs font-medium cursor-pointer transition-colors hover:opacity-80',
              info.bgColor,
              info.color,
              'border',
              info.borderColor
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {info.label}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn('p-2 rounded-lg', info.bgColor)}>
                <Icon className={cn('w-5 h-5', info.color)} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{info.label}</h4>
                <p className="text-xs text-muted-foreground">Message Verification Status</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{info.description}</p>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <HelpCircle className="w-3 h-3" />
                <span>How it works</span>
              </div>
              <p className="text-xs text-muted-foreground">{info.learnMore}</p>
            </div>

            {canVerify && (
              <>
                <Separator />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={onVerify}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FileKey className="w-3.5 h-3.5" />
                      Verify Now
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1 cursor-help')}>
            <Icon className={cn('w-4 h-4', info.color)} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{info.label}</p>
            <p className="text-xs text-muted-foreground">{info.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function MessageBubble({
  message,
  onRegenerate,
  onFlag,
  onViewMetadata,
  isRegenerating,
  showSignatureDetails = false,
  verificationEnabled = true,
  onVerificationComplete,
}: MessageBubbleProps) {
  const [showReasoning, setShowReasoning] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [localStatus, setLocalStatus] = useState<SignatureStatus | undefined>(
    message.signature_status
  )
  const { agents } = useStore()

  const isHuman = message.sender_type === 'human'
  const isSystem = message.sender_type === 'system'
  const isAgent = message.sender_type === 'agent'

  const agent = message.sender_id ? agents.find(a => a.id === message.sender_id) : null
  const agentName =
    (message.metadata as { agent_name?: string })?.agent_name || agent?.name || 'Agent'
  const agentRole =
    (message.metadata as { agent_role?: string })?.agent_role || agent?.role || ''
  const agentColor = agent ? getAgentColor(agent) : '#F5A623'

  const signatureStatus = localStatus || message.signature_status
  const isTampered = signatureStatus === 'tampered'
  const isVerified = signatureStatus === 'verified'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVerify = async () => {
    if (!verificationEnabled) return

    setIsVerifying(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/message-signatures/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message_id: message.id }),
        }
      )

      const data = await response.json()
      if (data.status) {
        setLocalStatus(data.status as SignatureStatus)
        onVerificationComplete?.(message.id, data.status)
      }
    } catch (error) {
      console.error('Verification failed:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center py-2"
      >
        <p className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-3 p-4 rounded-lg relative group',
        isHuman ? 'bg-primary/10' : 'bg-card',
        isTampered && 'ring-2 ring-red-500/50 bg-red-500/5',
        isVerified && verificationEnabled && 'ring-1 ring-emerald-500/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHuman ? (
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: agentColor }}
        >
          {agentName[0]}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{isHuman ? 'You' : agentName}</span>
          {!isHuman && agentRole && (
            <span className="text-xs text-muted-foreground">{agentRole}</span>
          )}
          {isAgent && verificationEnabled && (
            <VerificationBadge
              status={signatureStatus}
              verified={message.verified}
              error={message.verification_error || undefined}
              showDetails={showSignatureDetails}
              onVerify={handleVerify}
              isVerifying={isVerifying}
              verificationEnabled={verificationEnabled}
            />
          )}
          {isTampered && (
            <Badge variant="destructive" className="text-xs gap-1">
              <ShieldX className="w-3 h-3" />
              Warning: Tampered
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>

        <div className={cn('mt-2 text-sm whitespace-pre-wrap break-words', isTampered && 'opacity-75')}>
          {message.content}
        </div>

        {isTampered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <ShieldX className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-600 dark:text-red-400">Message Integrity Warning</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {message.verification_error ||
                    'The signature for this message does not match. The message content may have been modified after it was sent.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {isVerified && verificationEnabled && showSignatureDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Message verified - content is authentic</span>
            </div>
          </motion.div>
        )}

        {message.reasoning && (
          <div className="mt-3">
            <button
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              onClick={() => setShowReasoning(!showReasoning)}
            >
              <Brain className="w-3 h-3" />
              {showReasoning ? 'Hide' : 'Show'} reasoning
            </button>
            {showReasoning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 p-3 bg-muted/50 rounded text-xs text-muted-foreground italic"
              >
                {message.reasoning}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute top-2 right-2 flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-md p-1 shadow-sm"
          >
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{copied ? 'Copied!' : 'Copy message'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {isAgent && onRegenerate && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onRegenerate(message)}
                      disabled={isRegenerating}
                    >
                      <RefreshCw
                        className={cn('w-3.5 h-3.5', isRegenerating && 'animate-spin')}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Regenerate response</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {isAgent && verificationEnabled && signatureStatus === 'signed' && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleVerify}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileKey className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Verify signature</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {onFlag && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onFlag(message)}
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Flag message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {onViewMetadata && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onViewMetadata(message)}
                    >
                      <Info className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>View details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
