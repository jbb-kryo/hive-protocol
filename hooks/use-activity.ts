'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getRecentActivities } from '@/lib/activity-logger'

export interface Activity {
  id: string
  user_id: string
  activity_type: string
  title: string
  description: string | null
  metadata: any
  created_at: string
}

export function useActivity(limit: number = 10) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getRecentActivities(limit)
      setActivities(data)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchActivities()

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetchActivities()
      } else if (event === 'SIGNED_OUT') {
        setActivities([])
      }
    })

    const channel = supabase
      .channel('activity_log_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        (payload) => {
          const newActivity = payload.new as Activity
          setActivities((prev) => [newActivity, ...prev].slice(0, limit))
        }
      )
      .subscribe()

    return () => {
      authSubscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [fetchActivities, limit])

  return {
    activities,
    isLoading,
    refetch: fetchActivities,
  }
}
