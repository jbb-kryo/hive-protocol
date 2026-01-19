'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatTimeRemaining, getRateLimitMessage, type RateLimitEventType } from '@/lib/rate-limit'

interface RateLimitBannerProps {
  eventType: RateLimitEventType
  retryAfter: number
  onDismiss?: () => void
  onRetryReady?: () => void
}

export function RateLimitBanner({
  eventType,
  retryAfter,
  onDismiss,
  onRetryReady,
}: RateLimitBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState(retryAfter)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setTimeRemaining(retryAfter)
    setDismissed(false)
  }, [retryAfter])

  useEffect(() => {
    if (timeRemaining <= 0) {
      onRetryReady?.()
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onRetryReady?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, onRetryReady])

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed || timeRemaining <= 0) {
    return null
  }

  const progress = ((retryAfter - timeRemaining) / retryAfter) * 100

  return (
    <Alert variant="destructive" className="relative">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Rate Limit Exceeded
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{getRateLimitMessage(eventType)}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>Retry in: {formatTimeRemaining(timeRemaining)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface RateLimitInfoProps {
  plan: string
  usage: {
    messagesPerMinute: number
    messagesToday: number
  }
  limits: {
    messagesPerMinute: number
    messagesPerDay: number
  }
}

export function RateLimitInfo({ plan, usage, limits }: RateLimitInfoProps) {
  const minutePercent = (usage.messagesPerMinute / limits.messagesPerMinute) * 100
  const dayPercent = (usage.messagesToday / limits.messagesPerDay) * 100

  const isNearMinuteLimit = minutePercent >= 80
  const isNearDayLimit = dayPercent >= 80

  if (!isNearMinuteLimit && !isNearDayLimit) {
    return null
  }

  return (
    <div className="text-xs text-muted-foreground space-y-1">
      {isNearMinuteLimit && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span>
            {usage.messagesPerMinute}/{limits.messagesPerMinute} messages this minute
          </span>
        </div>
      )}
      {isNearDayLimit && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span>
            {usage.messagesToday}/{limits.messagesPerDay} messages today ({plan} plan)
          </span>
        </div>
      )}
    </div>
  )
}
