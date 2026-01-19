'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'

export interface SwarmPresenceUser {
  id: string
  swarm_id: string
  user_id: string
  joined_at: string
  last_seen_at: string
  is_active: boolean
  cursor_position: Record<string, unknown>
  profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

const HEARTBEAT_INTERVAL = 30000
const STALE_THRESHOLD = 120000

export function useSwarmPresence(swarmId: string | undefined) {
  const { user, isDemo } = useStore()
  const [viewers, setViewers] = useState<SwarmPresenceUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const presenceIdRef = useRef<string | null>(null)

  const fetchViewers = useCallback(async () => {
    if (!swarmId || isDemo) return

    const { data, error } = await supabase
      .from('swarm_presence')
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url)
      `)
      .eq('swarm_id', swarmId)
      .gte('last_seen_at', new Date(Date.now() - STALE_THRESHOLD).toISOString())
      .order('joined_at', { ascending: true })

    if (!error && data) {
      setViewers(data as SwarmPresenceUser[])
    }
  }, [swarmId, isDemo])

  const joinSwarm = useCallback(async () => {
    if (!swarmId || !user?.id || isDemo) return

    const { data, error } = await supabase
      .from('swarm_presence')
      .upsert({
        swarm_id: swarmId,
        user_id: user.id,
        joined_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'swarm_id,user_id',
      })
      .select()
      .maybeSingle()

    if (!error && data) {
      presenceIdRef.current = data.id
    }

    await fetchViewers()
  }, [swarmId, user?.id, isDemo, fetchViewers])

  const leaveSwarm = useCallback(async () => {
    if (!swarmId || !user?.id || isDemo) return

    await supabase
      .from('swarm_presence')
      .delete()
      .eq('swarm_id', swarmId)
      .eq('user_id', user.id)

    presenceIdRef.current = null
  }, [swarmId, user?.id, isDemo])

  const updatePresence = useCallback(async (isActive: boolean) => {
    if (!swarmId || !user?.id || isDemo) return

    await supabase
      .from('swarm_presence')
      .update({
        last_seen_at: new Date().toISOString(),
        is_active: isActive,
      })
      .eq('swarm_id', swarmId)
      .eq('user_id', user.id)
  }, [swarmId, user?.id, isDemo])

  const handleVisibilityChange = useCallback(() => {
    const isActive = document.visibilityState === 'visible'
    updatePresence(isActive)
  }, [updatePresence])

  const handleFocus = useCallback(() => {
    updatePresence(true)
  }, [updatePresence])

  const handleBlur = useCallback(() => {
    updatePresence(false)
  }, [updatePresence])

  const handleBeforeUnload = useCallback(() => {
    if (swarmId && user?.id && !isDemo) {
      navigator.sendBeacon?.(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/swarm_presence?swarm_id=eq.${swarmId}&user_id=eq.${user.id}`,
        ''
      )
    }
  }, [swarmId, user?.id, isDemo])

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
    }

    heartbeatRef.current = setInterval(() => {
      updatePresence(document.visibilityState === 'visible')
      fetchViewers()
    }, HEARTBEAT_INTERVAL)
  }, [updatePresence, fetchViewers])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!swarmId || isDemo) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase.channel(`swarm_presence_${swarmId}`)

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swarm_presence',
          filter: `swarm_id=eq.${swarmId}`,
        },
        () => {
          fetchViewers()
        }
      )
      .subscribe((status) => {
        setIsConnected(status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED)
      })

    channelRef.current = channel
  }, [swarmId, isDemo, fetchViewers])

  const cleanup = useCallback(async () => {
    stopHeartbeat()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    await leaveSwarm()

    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleFocus)
    window.removeEventListener('blur', handleBlur)
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [stopHeartbeat, leaveSwarm, handleVisibilityChange, handleFocus, handleBlur, handleBeforeUnload])

  useEffect(() => {
    if (!swarmId || !user?.id || isDemo) return

    const init = async () => {
      await joinSwarm()
      await subscribe()
      startHeartbeat()

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)
      window.addEventListener('blur', handleBlur)
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    init()

    return () => {
      cleanup()
    }
  }, [swarmId, user?.id, isDemo, joinSwarm, subscribe, startHeartbeat, handleVisibilityChange, handleFocus, handleBlur, handleBeforeUnload, cleanup])

  const otherViewers = viewers.filter(v => v.user_id !== user?.id)
  const activeViewers = otherViewers.filter(v => v.is_active)
  const inactiveViewers = otherViewers.filter(v => !v.is_active)

  return {
    viewers,
    otherViewers,
    activeViewers,
    inactiveViewers,
    totalViewers: viewers.length,
    isConnected,
    refresh: fetchViewers,
  }
}
