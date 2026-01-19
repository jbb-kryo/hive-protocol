'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface PlatformStats {
  total_users: number
  user_trend: number
  active_swarms: number
  swarm_trend: number
  messages_today: number
  message_trend: number
  mrr: number
  mrr_trend: number
}

interface UserGrowthData {
  name: string
  users: number
  month: string
}

interface FrameworkUsage {
  name: string
  value: number
  count: number
}

interface RecentSignup {
  id: string
  name: string
  email: string
  plan: string
  agents: number
  joined: string
  avatar_url: string | null
}

interface DailyMessage {
  date: string
  count: number
}

interface PlanDistribution {
  plan: string
  count: number
  percentage: number
}

export interface AdminStats {
  stats: PlatformStats | null
  userGrowth: UserGrowthData[]
  frameworkUsage: FrameworkUsage[]
  recentSignups: RecentSignup[]
  dailyMessages: DailyMessage[]
  planDistribution: PlanDistribution[]
}

const FRAMEWORK_COLORS: Record<string, string> = {
  'Anthropic': '#F5A623',
  'OpenAI': '#10B981',
  'HuggingFace': '#3B82F6',
  'Local': '#6B7280',
  'Groq': '#EF4444',
  'Gemini': '#8B5CF6',
  'Unknown': '#9CA3AF',
}

export function useAdminStats() {
  const [data, setData] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-stats?action=all`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch admin stats')
      }

      const result = await response.json()

      const frameworkUsageWithColors = (result.frameworkUsage || []).map((fw: FrameworkUsage) => ({
        ...fw,
        color: FRAMEWORK_COLORS[fw.name] || FRAMEWORK_COLORS['Unknown'],
      }))

      setData({
        stats: result.stats,
        userGrowth: result.userGrowth || [],
        frameworkUsage: frameworkUsageWithColors,
        recentSignups: result.recentSignups || [],
        dailyMessages: result.dailyMessages || [],
        planDistribution: result.planDistribution || [],
      })
    } catch (err) {
      console.error('Error fetching admin stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()

    const interval = setInterval(fetchStats, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [fetchStats])

  return {
    data,
    isLoading,
    error,
    refetch: fetchStats,
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}
