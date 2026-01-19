'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'

export interface UsageStats {
  today: {
    messages: number
    requests: number
    tokens: number
    tokens_input: number
    tokens_output: number
    tool_executions: number
    cost: number
  }
  week: {
    messages: number
    requests: number
    tokens: number
    tool_executions: number
    cost: number
  }
  month: {
    messages: number
    requests: number
    tokens: number
    tool_executions: number
    cost: number
  }
  limits: {
    plan: string
    messages_per_day: number
    requests_per_day: number
    tokens_per_day: number
    max_agents: number
    max_swarms: number
  }
  current: {
    agents: number
    swarms: number
  }
  percentages: {
    messages: number
    requests: number
    tokens: number
    agents: number
    swarms: number
  }
}

export interface UsageHistory {
  period_start: string
  messages_count: number
  ai_requests_count: number
  tokens_used: number
  tool_executions: number
  estimated_cost: number
}

export function useUsage() {
  const { user, isDemo } = useStore()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [history, setHistory] = useState<UsageHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsageStats = useCallback(async () => {
    if (isDemo || !user) {
      setStats({
        today: { messages: 45, requests: 23, tokens: 12500, tokens_input: 8000, tokens_output: 4500, tool_executions: 8, cost: 0.05 },
        week: { messages: 280, requests: 145, tokens: 78000, tool_executions: 52, cost: 0.32 },
        month: { messages: 1120, requests: 580, tokens: 312000, tool_executions: 208, cost: 1.28 },
        limits: { plan: 'pro', messages_per_day: 1000, requests_per_day: 500, tokens_per_day: 500000, max_agents: 20, max_swarms: 10 },
        current: { agents: 5, swarms: 3 },
        percentages: { messages: 4.5, requests: 4.6, tokens: 2.5, agents: 25, swarms: 30 }
      })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_usage_stats', {
        p_user_id: user.id
      })

      if (rpcError) throw rpcError

      setStats(data as UsageStats)
    } catch (err) {
      console.error('Error fetching usage stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch usage stats')
    } finally {
      setIsLoading(false)
    }
  }, [user, isDemo])

  const fetchUsageHistory = useCallback(async (days: number = 30) => {
    if (isDemo || !user) {
      const mockHistory: UsageHistory[] = []
      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        mockHistory.push({
          period_start: date.toISOString().split('T')[0],
          messages_count: Math.floor(Math.random() * 50) + 10,
          ai_requests_count: Math.floor(Math.random() * 30) + 5,
          tokens_used: Math.floor(Math.random() * 15000) + 5000,
          tool_executions: Math.floor(Math.random() * 10),
          estimated_cost: Math.random() * 0.1
        })
      }
      setHistory(mockHistory)
      return
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('get_usage_history', {
        p_user_id: user.id,
        p_days: days
      })

      if (rpcError) throw rpcError

      setHistory((data || []) as UsageHistory[])
    } catch (err) {
      console.error('Error fetching usage history:', err)
    }
  }, [user, isDemo])

  const checkRateLimit = useCallback(async (checkType: string = 'all'): Promise<{ allowed: boolean; reason?: string }> => {
    if (isDemo || !user) {
      return { allowed: true }
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_check_type: checkType
      })

      if (rpcError) throw rpcError

      return {
        allowed: data.allowed,
        reason: data.reason
      }
    } catch (err) {
      console.error('Error checking rate limit:', err)
      return { allowed: true }
    }
  }, [user, isDemo])

  useEffect(() => {
    fetchUsageStats()
    fetchUsageHistory()
  }, [fetchUsageStats, fetchUsageHistory])

  return {
    stats,
    history,
    isLoading,
    error,
    fetchUsageStats,
    fetchUsageHistory,
    checkRateLimit
  }
}
