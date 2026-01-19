import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface OverviewStats {
  total_users: number
  total_swarms: number
  total_agents: number
  total_messages: number
  messages_today: number
  messages_this_week: number
}

export interface MessageDataPoint {
  date: string
  count: number
}

export interface UserGrowthDataPoint {
  date: string
  new_users: number
  total_users: number
}

export interface ActiveUsersStats {
  dau: number
  wau: number
  mau: number
  total_users: number
  dau_percentage: number
  wau_percentage: number
  mau_percentage: number
}

export interface FrameworkUsage {
  framework: string
  count: number
  percentage: number
}

export interface TopSwarm {
  id: string
  name: string
  owner_name: string
  message_count: number
  agent_count: number
  last_activity: string
}

export interface PlanDistribution {
  plan: string
  count: number
  percentage: number
}

export interface ActivityTimelinePoint {
  date: string
  messages: number
  swarms: number
  agents: number
  users: number
}

async function fetchAnalytics(metric: string, params?: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const searchParams = new URLSearchParams({ metric, ...params })
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-analytics?${searchParams}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Request failed')
  }

  return response.json()
}

export function useAdminAnalytics() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getOverview = useCallback(async (): Promise<OverviewStats> => {
    return fetchAnalytics('overview')
  }, [])

  const getMessagesOverTime = useCallback(async (period: string = 'month'): Promise<MessageDataPoint[]> => {
    return fetchAnalytics('messages', { period })
  }, [])

  const getUserGrowth = useCallback(async (period: string = 'month'): Promise<UserGrowthDataPoint[]> => {
    return fetchAnalytics('user-growth', { period })
  }, [])

  const getActiveUsers = useCallback(async (): Promise<ActiveUsersStats> => {
    return fetchAnalytics('active-users')
  }, [])

  const getFrameworkUsage = useCallback(async (): Promise<FrameworkUsage[]> => {
    return fetchAnalytics('framework-usage')
  }, [])

  const getTopSwarms = useCallback(async (limit: number = 10): Promise<TopSwarm[]> => {
    return fetchAnalytics('top-swarms', { limit: limit.toString() })
  }, [])

  const getPlanDistribution = useCallback(async (): Promise<PlanDistribution[]> => {
    return fetchAnalytics('plan-distribution')
  }, [])

  const getActivityTimeline = useCallback(async (period: string = 'month'): Promise<ActivityTimelinePoint[]> => {
    return fetchAnalytics('activity-timeline', { period })
  }, [])

  const exportAnalytics = useCallback(async (format: 'json' | 'csv' = 'json') => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-analytics?metric=export&format=${format}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(downloadUrl)
  }, [])

  return {
    loading,
    error,
    getOverview,
    getMessagesOverTime,
    getUserGrowth,
    getActiveUsers,
    getFrameworkUsage,
    getTopSwarms,
    getPlanDistribution,
    getActivityTimeline,
    exportAnalytics,
  }
}
