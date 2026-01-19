'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'

export type AgentStatus = 'online' | 'busy' | 'idle' | 'offline'
export type ActivityType = 'thinking' | 'typing' | 'processing' | 'idle' | null

export interface AgentPresence {
  id: string
  agent_id: string
  user_id: string
  status: AgentStatus
  activity_type: ActivityType
  swarm_id: string | null
  started_at: string
  metadata: Record<string, unknown>
}

export interface AgentStatusInfo {
  status: AgentStatus
  activityType: ActivityType
  swarmId: string | null
  lastUpdate: Date
}

export function useAgentPresence() {
  const { user, isDemo } = useStore()
  const [presenceMap, setPresenceMap] = useState<Map<string, AgentStatusInfo>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const activityTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const IDLE_TIMEOUT = 30000
  const OFFLINE_TIMEOUT = 120000

  const updatePresenceMap = useCallback((agentId: string, info: Partial<AgentStatusInfo>) => {
    setPresenceMap(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(agentId) || {
        status: 'offline' as AgentStatus,
        activityType: null,
        swarmId: null,
        lastUpdate: new Date(),
      }
      newMap.set(agentId, { ...existing, ...info, lastUpdate: new Date() })
      return newMap
    })
  }, [])

  const setAgentStatus = useCallback(async (
    agentId: string,
    status: AgentStatus,
    activityType: ActivityType = null,
    swarmId: string | null = null,
    metadata: Record<string, unknown> = {}
  ) => {
    if (isDemo || !user?.id) return

    updatePresenceMap(agentId, { status, activityType, swarmId })

    const { error } = await supabase
      .from('agent_presence')
      .upsert({
        agent_id: agentId,
        user_id: user.id,
        status,
        activity_type: activityType,
        swarm_id: swarmId,
        started_at: new Date().toISOString(),
        metadata,
      }, {
        onConflict: 'agent_id',
      })

    if (error) {
      console.error('Error updating agent presence:', error)
    }

    await supabase
      .from('agents')
      .update({
        status,
        last_activity_at: new Date().toISOString(),
        current_task: activityType === 'processing' ? (metadata.task as string) || null : null,
      })
      .eq('id', agentId)
  }, [isDemo, user?.id, updatePresenceMap])

  const setAgentThinking = useCallback((agentId: string, swarmId?: string) => {
    return setAgentStatus(agentId, 'busy', 'thinking', swarmId || null)
  }, [setAgentStatus])

  const setAgentTyping = useCallback((agentId: string, swarmId?: string) => {
    return setAgentStatus(agentId, 'busy', 'typing', swarmId || null)
  }, [setAgentStatus])

  const setAgentProcessing = useCallback((agentId: string, task?: string, swarmId?: string) => {
    return setAgentStatus(agentId, 'busy', 'processing', swarmId || null, { task })
  }, [setAgentStatus])

  const setAgentIdle = useCallback((agentId: string) => {
    return setAgentStatus(agentId, 'idle', 'idle', null)
  }, [setAgentStatus])

  const setAgentOnline = useCallback((agentId: string) => {
    return setAgentStatus(agentId, 'online', null, null)
  }, [setAgentStatus])

  const setAgentOffline = useCallback((agentId: string) => {
    return setAgentStatus(agentId, 'offline', null, null)
  }, [setAgentStatus])

  const getAgentStatus = useCallback((agentId: string): AgentStatusInfo => {
    return presenceMap.get(agentId) || {
      status: 'offline',
      activityType: null,
      swarmId: null,
      lastUpdate: new Date(),
    }
  }, [presenceMap])

  const startActivityTimer = useCallback((agentId: string) => {
    const existingTimeout = activityTimeoutsRef.current.get(agentId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const idleTimeout = setTimeout(() => {
      const currentStatus = presenceMap.get(agentId)
      if (currentStatus?.status === 'busy' || currentStatus?.status === 'online') {
        setAgentIdle(agentId)
      }

      const offlineTimeout = setTimeout(() => {
        setAgentOffline(agentId)
      }, OFFLINE_TIMEOUT - IDLE_TIMEOUT)

      activityTimeoutsRef.current.set(agentId, offlineTimeout)
    }, IDLE_TIMEOUT)

    activityTimeoutsRef.current.set(agentId, idleTimeout)
  }, [presenceMap, setAgentIdle, setAgentOffline])

  const recordActivity = useCallback((agentId: string) => {
    const currentStatus = presenceMap.get(agentId)
    if (currentStatus?.status === 'idle' || currentStatus?.status === 'offline') {
      setAgentOnline(agentId)
    }
    startActivityTimer(agentId)
  }, [presenceMap, setAgentOnline, startActivityTimer])

  const fetchInitialPresence = useCallback(async () => {
    if (isDemo || !user?.id) return

    const { data, error } = await supabase
      .from('agent_presence')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching agent presence:', error)
      return
    }

    const newMap = new Map<string, AgentStatusInfo>()
    data?.forEach((presence: AgentPresence) => {
      newMap.set(presence.agent_id, {
        status: presence.status as AgentStatus,
        activityType: presence.activity_type as ActivityType,
        swarmId: presence.swarm_id,
        lastUpdate: new Date(presence.started_at),
      })
    })
    setPresenceMap(newMap)
  }, [isDemo, user?.id])

  const handlePresenceChange = useCallback((payload: { eventType: string; new: AgentPresence; old: AgentPresence }) => {
    const { eventType, new: newPresence, old: oldPresence } = payload

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      updatePresenceMap(newPresence.agent_id, {
        status: newPresence.status as AgentStatus,
        activityType: newPresence.activity_type as ActivityType,
        swarmId: newPresence.swarm_id,
      })
    } else if (eventType === 'DELETE' && oldPresence) {
      updatePresenceMap(oldPresence.agent_id, {
        status: 'offline',
        activityType: null,
        swarmId: null,
      })
    }
  }, [updatePresenceMap])

  const subscribe = useCallback(async () => {
    if (isDemo || !user?.id) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    await fetchInitialPresence()

    const channel = supabase.channel(`agent_presence_${user.id}`)

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_presence',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => handlePresenceChange(payload as unknown as { eventType: string; new: AgentPresence; old: AgentPresence })
      )
      .subscribe((status) => {
        setIsConnected(status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED)
      })

    channelRef.current = channel
  }, [isDemo, user?.id, fetchInitialPresence, handlePresenceChange])

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    activityTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    activityTimeoutsRef.current.clear()
  }, [])

  useEffect(() => {
    if (user?.id && !isDemo) {
      subscribe()
    }
    return cleanup
  }, [user?.id, isDemo, subscribe, cleanup])

  return {
    presenceMap,
    isConnected,
    getAgentStatus,
    setAgentStatus,
    setAgentThinking,
    setAgentTyping,
    setAgentProcessing,
    setAgentIdle,
    setAgentOnline,
    setAgentOffline,
    recordActivity,
    refresh: fetchInitialPresence,
  }
}

export function useAgentStatusIndicator(agentId: string | undefined) {
  const { getAgentStatus, recordActivity, setAgentThinking, setAgentTyping, setAgentIdle } = useAgentPresence()
  const [localStatus, setLocalStatus] = useState<AgentStatusInfo | null>(null)

  useEffect(() => {
    if (!agentId) return
    const status = getAgentStatus(agentId)
    setLocalStatus(status)
  }, [agentId, getAgentStatus])

  const startThinking = useCallback(() => {
    if (agentId) {
      setAgentThinking(agentId)
      setLocalStatus(prev => prev ? { ...prev, status: 'busy', activityType: 'thinking' } : null)
    }
  }, [agentId, setAgentThinking])

  const startTyping = useCallback(() => {
    if (agentId) {
      setAgentTyping(agentId)
      setLocalStatus(prev => prev ? { ...prev, status: 'busy', activityType: 'typing' } : null)
    }
  }, [agentId, setAgentTyping])

  const stopActivity = useCallback(() => {
    if (agentId) {
      setAgentIdle(agentId)
      setLocalStatus(prev => prev ? { ...prev, status: 'idle', activityType: 'idle' } : null)
    }
  }, [agentId, setAgentIdle])

  const touch = useCallback(() => {
    if (agentId) {
      recordActivity(agentId)
    }
  }, [agentId, recordActivity])

  return {
    status: localStatus?.status || 'offline',
    activityType: localStatus?.activityType || null,
    swarmId: localStatus?.swarmId || null,
    startThinking,
    startTyping,
    stopActivity,
    touch,
  }
}
