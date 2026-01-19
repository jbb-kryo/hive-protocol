'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { useToast } from '@/hooks/use-toast'
import type { Swarm, Message, Agent } from '@/lib/supabase'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface SwarmRealtimeOptions {
  onSwarmUpdate?: (swarm: Swarm) => void
  onSwarmDelete?: (swarmId: string) => void
  onAgentAdded?: (swarmId: string, agent: Agent) => void
  onAgentRemoved?: (swarmId: string, agentId: string) => void
  onMessageReceived?: (message: Message) => void
  showNotifications?: boolean
}

export function useSwarmRealtime(options: SwarmRealtimeOptions = {}) {
  const { showNotifications = true } = options
  const { toast } = useToast()
  const { user, swarms, updateSwarm, removeSwarm, isDemo } = useStore()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [lastStatusChange, setLastStatusChange] = useState<{ swarmId: string; oldStatus: string; newStatus: string } | null>(null)

  const MAX_RECONNECT_ATTEMPTS = 5
  const RECONNECT_DELAY_BASE = 2000

  const showStatusNotification = useCallback((swarmName: string, oldStatus: string, newStatus: string) => {
    if (!showNotifications) return

    const statusMessages: Record<string, { title: string; description: string }> = {
      active: { title: 'Swarm Active', description: `${swarmName} is now active` },
      paused: { title: 'Swarm Paused', description: `${swarmName} has been paused` },
      completed: { title: 'Swarm Completed', description: `${swarmName} has completed its task` },
      error: { title: 'Swarm Error', description: `${swarmName} encountered an error` },
    }

    const message = statusMessages[newStatus] || {
      title: 'Status Changed',
      description: `${swarmName} status: ${newStatus}`,
    }

    toast({
      title: message.title,
      description: message.description,
    })
  }, [showNotifications, toast])

  const handleSwarmChange = useCallback((payload: { eventType: string; new: Swarm; old: Swarm }) => {
    const { eventType, new: newSwarm, old: oldSwarm } = payload

    if (eventType === 'UPDATE') {
      updateSwarm(newSwarm.id, newSwarm)

      if (oldSwarm?.status !== newSwarm.status) {
        setLastStatusChange({
          swarmId: newSwarm.id,
          oldStatus: oldSwarm?.status || 'unknown',
          newStatus: newSwarm.status,
        })
        showStatusNotification(newSwarm.name, oldSwarm?.status || 'unknown', newSwarm.status)
        options.onSwarmUpdate?.(newSwarm)
      }
    } else if (eventType === 'DELETE') {
      removeSwarm(oldSwarm.id)
      options.onSwarmDelete?.(oldSwarm.id)

      if (showNotifications) {
        toast({
          title: 'Swarm Deleted',
          description: `${oldSwarm.name} has been deleted`,
        })
      }
    }
  }, [updateSwarm, removeSwarm, showStatusNotification, options, showNotifications, toast])

  const handleAgentChange = useCallback((payload: { eventType: string; new: { swarm_id: string; agent_id: string }; old: { swarm_id: string; agent_id: string } }) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    if (eventType === 'INSERT') {
      (async () => {
        const { data: agent } = await supabase
          .from('agents')
          .select('*')
          .eq('id', newRecord.agent_id)
          .maybeSingle()

        if (agent) {
          options.onAgentAdded?.(newRecord.swarm_id, agent)

          if (showNotifications) {
            const swarm = swarms.find(s => s.id === newRecord.swarm_id)
            toast({
              title: 'Agent Joined',
              description: `${agent.name} joined ${swarm?.name || 'the swarm'}`,
            })
          }
        }
      })()
    } else if (eventType === 'DELETE') {
      options.onAgentRemoved?.(oldRecord.swarm_id, oldRecord.agent_id)
    }
  }, [options, showNotifications, swarms, toast])

  const handleMessageChange = useCallback((payload: { eventType: string; new: Message }) => {
    if (payload.eventType === 'INSERT') {
      options.onMessageReceived?.(payload.new)
    }
  }, [options])

  const handleConnectionChange = useCallback((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
    switch (status) {
      case REALTIME_SUBSCRIBE_STATES.SUBSCRIBED:
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
        break
      case REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR:
        setConnectionStatus('error')
        break
      case REALTIME_SUBSCRIBE_STATES.TIMED_OUT:
      case REALTIME_SUBSCRIBE_STATES.CLOSED:
        setConnectionStatus('disconnected')
        break
    }
  }, [])

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionStatus('error')
      if (showNotifications) {
        toast({
          variant: 'destructive',
          title: 'Connection Lost',
          description: 'Unable to reconnect to real-time updates. Please refresh the page.',
        })
      }
      return
    }

    const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttemptsRef.current)
    reconnectAttemptsRef.current += 1

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      subscribe()
    }, delay)
  }, [showNotifications, toast])

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (isDemo || !user?.id) return

    cleanup()
    setConnectionStatus('connecting')

    const channel = supabase.channel(`user_swarms_${user.id}`)

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swarms',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => handleSwarmChange(payload as unknown as { eventType: string; new: Swarm; old: Swarm })
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swarm_agents',
        },
        (payload) => handleAgentChange(payload as unknown as { eventType: string; new: { swarm_id: string; agent_id: string }; old: { swarm_id: string; agent_id: string } })
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => handleMessageChange(payload as unknown as { eventType: string; new: Message })
      )
      .subscribe((status) => {
        handleConnectionChange(status)
        if (status === REALTIME_SUBSCRIBE_STATES.CLOSED || status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
          attemptReconnect()
        }
      })

    channelRef.current = channel
  }, [isDemo, user?.id, cleanup, handleSwarmChange, handleAgentChange, handleMessageChange, handleConnectionChange, attemptReconnect])

  const unsubscribe = useCallback(() => {
    cleanup()
    setConnectionStatus('disconnected')
  }, [cleanup])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    subscribe()
  }, [subscribe])

  useEffect(() => {
    if (user?.id && !isDemo) {
      subscribe()
    }

    return () => {
      cleanup()
    }
  }, [user?.id, isDemo, subscribe, cleanup])

  useEffect(() => {
    const handleOnline = () => {
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        reconnect()
      }
    }

    const handleOffline = () => {
      setConnectionStatus('disconnected')
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionStatus !== 'connected') {
        reconnect()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connectionStatus, reconnect])

  return {
    connectionStatus,
    lastStatusChange,
    subscribe,
    unsubscribe,
    reconnect,
  }
}

export function useSwarmStatusSubscription(swarmId: string | undefined, options: {
  onStatusChange?: (oldStatus: string, newStatus: string) => void
  onAgentChange?: () => void
  showNotifications?: boolean
} = {}) {
  const { showNotifications = true, onStatusChange, onAgentChange } = options
  const { toast } = useToast()
  const { updateSwarm, currentSwarm, setCurrentSwarm, isDemo } = useStore()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const MAX_RECONNECT_ATTEMPTS = 5
  const RECONNECT_DELAY_BASE = 2000

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  const attemptReconnect = useCallback(() => {
    if (!swarmId || reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionStatus('error')
      return
    }

    const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttemptsRef.current)
    reconnectAttemptsRef.current += 1

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      subscribe()
    }, delay)
  }, [swarmId])

  const subscribe = useCallback(async () => {
    if (isDemo || !swarmId) return

    cleanup()
    setConnectionStatus('connecting')

    const channel = supabase.channel(`swarm_status_${swarmId}`)

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'swarms',
          filter: `id=eq.${swarmId}`,
        },
        (payload) => {
          const newSwarm = payload.new as Swarm
          const oldSwarm = payload.old as Swarm

          updateSwarm(swarmId, newSwarm)

          if (currentSwarm?.id === swarmId) {
            setCurrentSwarm({ ...currentSwarm, ...newSwarm })
          }

          if (oldSwarm.status !== newSwarm.status) {
            onStatusChange?.(oldSwarm.status, newSwarm.status)

            if (showNotifications) {
              const statusMessages: Record<string, string> = {
                active: 'Swarm is now active',
                paused: 'Swarm has been paused',
                completed: 'Swarm has completed',
                error: 'Swarm encountered an error',
              }
              toast({
                title: 'Status Changed',
                description: statusMessages[newSwarm.status] || `Status: ${newSwarm.status}`,
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swarm_agents',
          filter: `swarm_id=eq.${swarmId}`,
        },
        () => {
          onAgentChange?.()
        }
      )
      .subscribe((status) => {
        switch (status) {
          case REALTIME_SUBSCRIBE_STATES.SUBSCRIBED:
            setConnectionStatus('connected')
            reconnectAttemptsRef.current = 0
            break
          case REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR:
            setConnectionStatus('error')
            attemptReconnect()
            break
          case REALTIME_SUBSCRIBE_STATES.TIMED_OUT:
          case REALTIME_SUBSCRIBE_STATES.CLOSED:
            setConnectionStatus('disconnected')
            attemptReconnect()
            break
        }
      })

    channelRef.current = channel
  }, [isDemo, swarmId, cleanup, updateSwarm, currentSwarm, setCurrentSwarm, onStatusChange, onAgentChange, showNotifications, toast, attemptReconnect])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    subscribe()
  }, [subscribe])

  useEffect(() => {
    if (swarmId && !isDemo) {
      subscribe()
    }

    return () => {
      cleanup()
    }
  }, [swarmId, isDemo, subscribe, cleanup])

  useEffect(() => {
    const handleOnline = () => {
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        reconnect()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionStatus !== 'connected') {
        reconnect()
      }
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connectionStatus, reconnect])

  return {
    connectionStatus,
    reconnect,
  }
}
