'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateDashboardStats, DashboardStats } from '@/lib/stats-calculator'

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await calculateDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetchStats()
      } else if (event === 'SIGNED_OUT') {
        setStats(null)
      }
    })

    const swarmsChannel = supabase
      .channel('stats_swarms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swarms',
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    const agentsChannel = supabase
      .channel('stats_agents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents',
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    const messagesChannel = supabase
      .channel('stats_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    const integrationsChannel = supabase
      .channel('stats_integrations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integrations',
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      authSubscription.unsubscribe()
      supabase.removeChannel(swarmsChannel)
      supabase.removeChannel(agentsChannel)
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(integrationsChannel)
    }
  }, [fetchStats])

  return {
    stats,
    isLoading,
    refetch: fetchStats,
  }
}
