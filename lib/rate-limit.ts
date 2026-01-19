import { supabase } from './supabase'

export type RateLimitEventType =
  | 'message'
  | 'request'
  | 'ai_request'
  | 'agent_create'
  | 'swarm_create'
  | 'tokens'

export interface RateLimitCheckResult {
  allowed: boolean
  reason?: string
  retryAfter?: number
  usage: {
    messagesPerMinute: number
    messagesToday: number
    requestsPerMinute: number
    requestsToday: number
    tokensToday: number
    agentsCreatedToday: number
    swarmsCreatedToday: number
  }
  limits: {
    plan: string
    messagesPerMinute: number
    messagesPerDay: number
    requestsPerMinute: number
    requestsPerDay: number
    tokensPerDay: number
    maxAgents: number
    maxSwarms: number
    agentsPerDay: number
    swarmsPerDay: number
  }
}

export class RateLimitError extends Error {
  retryAfter: number
  eventType: string

  constructor(message: string, retryAfter: number, eventType: string) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
    this.eventType = eventType
  }
}

export async function checkAndConsumeRateLimit(
  eventType: RateLimitEventType,
  resourceId?: string
): Promise<RateLimitCheckResult> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-rate-limit`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        event_type: eventType,
        consume: true,
        resource_id: resourceId,
      }),
    }
  )

  const data = await response.json()

  if (response.status === 429) {
    throw new RateLimitError(
      data.message || 'Rate limit exceeded',
      data.retry_after || 60,
      eventType
    )
  }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to check rate limit')
  }

  return {
    allowed: data.allowed,
    reason: data.reason,
    retryAfter: data.retry_after,
    usage: {
      messagesPerMinute: data.usage.messages_per_minute,
      messagesToday: data.usage.messages_today,
      requestsPerMinute: data.usage.requests_per_minute,
      requestsToday: data.usage.requests_today,
      tokensToday: data.usage.tokens_today,
      agentsCreatedToday: data.usage.agents_created_today,
      swarmsCreatedToday: data.usage.swarms_created_today,
    },
    limits: {
      plan: data.limits.plan,
      messagesPerMinute: data.limits.messages_per_minute,
      messagesPerDay: data.limits.messages_per_day,
      requestsPerMinute: data.limits.requests_per_minute,
      requestsPerDay: data.limits.requests_per_day,
      tokensPerDay: data.limits.tokens_per_day,
      maxAgents: data.limits.max_agents,
      maxSwarms: data.limits.max_swarms,
      agentsPerDay: data.limits.agents_per_day,
      swarmsPerDay: data.limits.swarms_per_day,
    },
  }
}

export async function getRateLimitStatus(): Promise<{
  plan: string
  messages: {
    perMinute: { used: number; limit: number; remaining: number }
    perDay: { used: number; limit: number; remaining: number }
  }
  requests: {
    perMinute: { used: number; limit: number; remaining: number }
    perDay: { used: number; limit: number; remaining: number }
  }
  tokens: {
    perDay: { used: number; limit: number; remaining: number }
  }
  agents: {
    perDay: { created: number; limit: number }
    total: { count: number; limit: number }
  }
  swarms: {
    perDay: { created: number; limit: number }
    total: { count: number; limit: number }
  }
  resetsAt: {
    minute: string
    day: string
  }
} | null> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase.rpc('get_rate_limit_status', {
    p_user_id: user.id,
  })

  if (error) {
    console.error('Error fetching rate limit status:', error)
    return null
  }

  return data
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.ceil(seconds % 60)

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`
}

export function getRateLimitMessage(eventType: RateLimitEventType): string {
  switch (eventType) {
    case 'message':
      return 'You have sent too many messages. Please wait before sending more.'
    case 'request':
    case 'ai_request':
      return 'Too many API requests. Please slow down.'
    case 'agent_create':
      return 'You have created too many agents today. Please try again tomorrow.'
    case 'swarm_create':
      return 'You have created too many swarms today. Please try again tomorrow.'
    case 'tokens':
      return 'You have used your daily token allowance. Please try again tomorrow.'
    default:
      return 'Rate limit exceeded. Please try again later.'
  }
}
