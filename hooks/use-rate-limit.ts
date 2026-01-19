import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type RateLimitEventType =
  | 'message'
  | 'request'
  | 'ai_request'
  | 'agent_create'
  | 'swarm_create'
  | 'tokens'

export interface RateLimitUsage {
  messages_per_minute: number
  messages_today: number
  requests_per_minute: number
  requests_today: number
  tokens_today: number
  agents_created_today: number
  swarms_created_today: number
}

export interface RateLimitLimits {
  plan: string
  messages_per_minute: number
  messages_per_day: number
  requests_per_minute: number
  requests_per_day: number
  tokens_per_day: number
  max_agents: number
  max_swarms: number
  agents_per_day: number
  swarms_per_day: number
}

export interface RateLimitStatus {
  allowed: boolean
  reason?: string
  retry_after?: number
  event_type: string
  usage: RateLimitUsage
  limits: RateLimitLimits
}

export interface RateLimitError {
  status: 429
  message: string
  retry_after: number
  usage: RateLimitUsage
  limits: RateLimitLimits
}

export class RateLimitExceededError extends Error {
  status: number
  retryAfter: number
  usage: RateLimitUsage
  limits: RateLimitLimits

  constructor(data: RateLimitError) {
    super(data.message)
    this.name = 'RateLimitExceededError'
    this.status = 429
    this.retryAfter = data.retry_after
    this.usage = data.usage
    this.limits = data.limits
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  }
}

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

export async function checkRateLimit(
  eventType: RateLimitEventType,
  options?: { consume?: boolean; resourceId?: string }
): Promise<RateLimitStatus> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${getSupabaseUrl()}/functions/v1/check-rate-limit`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event_type: eventType,
        consume: options?.consume || false,
        resource_id: options?.resourceId,
      }),
    }
  )

  const data = await response.json()

  if (response.status === 429) {
    throw new RateLimitExceededError({
      status: 429,
      message: data.message || 'Rate limit exceeded',
      retry_after: data.retry_after || 60,
      usage: data.usage,
      limits: data.limits,
    })
  }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to check rate limit')
  }

  return data as RateLimitStatus
}

export async function consumeRateLimit(
  eventType: RateLimitEventType,
  resourceId?: string
): Promise<RateLimitStatus> {
  return checkRateLimit(eventType, { consume: true, resourceId })
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  }

  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  const hours = Math.ceil(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  const days = Math.ceil(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''}`
}

export function useRateLimit() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<RateLimitExceededError | Error | null>(null)
  const [status, setStatus] = useState<RateLimitStatus | null>(null)

  const check = useCallback(async (
    eventType: RateLimitEventType,
    options?: { consume?: boolean; resourceId?: string }
  ): Promise<RateLimitStatus | null> => {
    try {
      setLoading(true)
      setError(null)
      const result = await checkRateLimit(eventType, options)
      setStatus(result)
      return result
    } catch (err) {
      if (err instanceof RateLimitExceededError) {
        setError(err)
        setStatus({
          allowed: false,
          reason: err.message,
          retry_after: err.retryAfter,
          event_type: eventType,
          usage: err.usage,
          limits: err.limits,
        })
      } else {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const consume = useCallback(async (
    eventType: RateLimitEventType,
    resourceId?: string
  ): Promise<RateLimitStatus | null> => {
    return check(eventType, { consume: true, resourceId })
  }, [check])

  const reset = useCallback(() => {
    setError(null)
    setStatus(null)
  }, [])

  return {
    loading,
    error,
    status,
    check,
    consume,
    reset,
    isRateLimited: error instanceof RateLimitExceededError,
    retryAfter: error instanceof RateLimitExceededError ? error.retryAfter : null,
    retryAfterFormatted: error instanceof RateLimitExceededError
      ? formatRetryAfter(error.retryAfter)
      : null,
  }
}

export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  eventType: RateLimitEventType
): T {
  return (async (...args: Parameters<T>) => {
    await consumeRateLimit(eventType)
    return fn(...args)
  }) as T
}
