'use client'

import { useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { logActivity } from '@/lib/activity-logger'
import { sanitizeMessageContent, sanitizeSwarmName, sanitizeText } from '@/lib/sanitize'
import type { Swarm, Message, Agent } from '@/lib/supabase'

export function useSwarm(swarmId?: string) {
  const {
    swarms,
    setSwarms,
    addSwarm,
    updateSwarm,
    removeSwarm,
    currentSwarm,
    setCurrentSwarm,
    messages,
    setMessages,
    addMessage,
    isDemo,
  } = useStore()

  const fetchSwarms = useCallback(async () => {
    if (isDemo) return

    const { data, error } = await supabase
      .from('swarms')
      .select(`
        *,
        swarm_agents (
          agent:agents (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching swarms:', error)
      return
    }

    const swarmsWithAgents = data.map((swarm) => ({
      ...swarm,
      agents: swarm.swarm_agents?.map((sa: { agent: Agent }) => sa.agent) || [],
    }))

    setSwarms(swarmsWithAgents)
  }, [isDemo, setSwarms])

  const fetchSwarm = useCallback(async (id: string, shareToken?: string) => {
    if (isDemo) return

    let query = supabase
      .from('swarms')
      .select(`
        *,
        swarm_agents (
          agent:agents (*)
        )
      `)
      .eq('id', id)

    if (shareToken) {
      query = query.eq('share_token', shareToken)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('Error fetching swarm:', error)
      return
    }

    if (data) {
      const swarmWithAgents = {
        ...data,
        agents: data.swarm_agents?.map((sa: { agent: Agent }) => sa.agent) || [],
      }
      setCurrentSwarm(swarmWithAgents)
    }
  }, [isDemo, setCurrentSwarm])

  const fetchMessages = useCallback(async (id: string) => {
    if (isDemo) return

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('swarm_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return
    }

    setMessages(data || [])
  }, [isDemo, setMessages])

  const createSwarm = useCallback(async (name: string, task: string, agentIds: string[]) => {
    const sanitizedName = sanitizeSwarmName(name)
    const sanitizedTask = sanitizeText(task)

    if (!sanitizedName) {
      throw new Error('Swarm name cannot be empty')
    }

    if (isDemo) {
      const newSwarm: Swarm = {
        id: `demo_swarm_${Date.now()}`,
        user_id: 'demo',
        name: sanitizedName,
        task: sanitizedTask,
        status: 'active',
        settings: {},
        visibility: 'private',
        share_token: null,
        allow_guest_messages: false,
        created_at: new Date().toISOString(),
      }
      addSwarm(newSwarm)
      return newSwarm
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('You must be logged in to create a swarm')
    }

    const { data: swarm, error: swarmError } = await supabase
      .from('swarms')
      .insert({ name: sanitizedName, task: sanitizedTask, user_id: user.id })
      .select()
      .single()

    if (swarmError) {
      console.error('Error creating swarm:', swarmError)
      throw swarmError
    }

    if (agentIds.length > 0) {
      const swarmAgents = agentIds.map((agentId) => ({
        swarm_id: swarm.id,
        agent_id: agentId,
      }))

      await supabase.from('swarm_agents').insert(swarmAgents)
    }

    await logActivity({
      type: 'swarm_created',
      title: `Created swarm: ${name}`,
      description: task || undefined,
      metadata: {
        swarm_id: swarm.id,
        swarm_name: name,
        agent_count: agentIds.length,
      },
    })

    addSwarm(swarm)
    return swarm
  }, [isDemo, addSwarm])

  const sendMessage = useCallback(async (content: string, senderType: 'human' | 'system' = 'human') => {
    if (!currentSwarm) return

    const sanitizedContent = sanitizeMessageContent(content)
    if (!sanitizedContent) {
      throw new Error('Message cannot be empty')
    }

    const newMessage: Message = {
      id: isDemo ? `demo_msg_${Date.now()}` : '',
      swarm_id: currentSwarm.id,
      sender_id: null,
      sender_type: senderType,
      content: sanitizedContent,
      reasoning: null,
      signature: null,
      verified: false,
      metadata: {},
      created_at: new Date().toISOString(),
    }

    if (isDemo) {
      addMessage(newMessage)
      return newMessage
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        swarm_id: currentSwarm.id,
        sender_type: senderType,
        content: sanitizedContent,
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      throw error
    }

    await logActivity({
      type: 'message_sent',
      title: 'Message sent',
      description: sanitizedContent.length > 50 ? `${sanitizedContent.substring(0, 50)}...` : sanitizedContent,
      metadata: {
        swarm_id: currentSwarm.id,
        swarm_name: currentSwarm.name,
        message_preview: sanitizedContent.substring(0, 100),
      },
    })

    addMessage(data)
    return data
  }, [currentSwarm, isDemo, addMessage])

  const updateSwarmDb = useCallback(async (id: string, updates: Partial<Swarm>) => {
    if (isDemo) {
      updateSwarm(id, updates)
      return
    }

    const { error } = await supabase
      .from('swarms')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Error updating swarm:', error)
      throw error
    }

    updateSwarm(id, updates)

    await logActivity({
      type: 'swarm_updated',
      title: 'Swarm updated',
      description: updates.name || 'Swarm details updated',
      metadata: {
        swarm_id: id,
        updates,
      },
    })

    await fetchSwarms()
  }, [isDemo, updateSwarm, fetchSwarms])

  const deleteSwarmDb = useCallback(async (id: string) => {
    if (isDemo) {
      removeSwarm(id)
      return
    }

    const swarmToDelete = swarms.find(s => s.id === id)

    const { error } = await supabase
      .from('swarms')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting swarm:', error)
      throw error
    }

    removeSwarm(id)

    await logActivity({
      type: 'swarm_deleted',
      title: 'Swarm deleted',
      description: swarmToDelete?.name || 'A swarm was deleted',
      metadata: {
        swarm_id: id,
        swarm_name: swarmToDelete?.name,
      },
    })

    await fetchSwarms()
  }, [isDemo, removeSwarm, swarms, fetchSwarms])

  useEffect(() => {
    if (!swarmId || isDemo) return

    const channel = supabase
      .channel(`swarm_${swarmId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `swarm_id=eq.${swarmId}`,
        },
        (payload) => {
          addMessage(payload.new as Message)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [swarmId, isDemo, addMessage])

  useEffect(() => {
    if (swarmId) {
      fetchSwarm(swarmId)
      fetchMessages(swarmId)
    }
  }, [swarmId, fetchSwarm, fetchMessages])

  const checkOwnership = useCallback(async (swarmId: string): Promise<boolean> => {
    if (isDemo) return true

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
      .from('swarms')
      .select('user_id')
      .eq('id', swarmId)
      .maybeSingle()

    return data?.user_id === user.id
  }, [isDemo])

  const addAgentToSwarm = useCallback(async (swarmId: string, agentId: string) => {
    if (isDemo) {
      return
    }

    const { error: checkError } = await supabase
      .from('swarm_agents')
      .select('id')
      .eq('swarm_id', swarmId)
      .eq('agent_id', agentId)
      .maybeSingle()

    if (!checkError) {
      throw new Error('Agent is already in this swarm')
    }

    const { error } = await supabase
      .from('swarm_agents')
      .insert({
        swarm_id: swarmId,
        agent_id: agentId,
      })

    if (error) {
      console.error('Error adding agent to swarm:', error)
      throw error
    }

    await logActivity({
      type: 'agent_added',
      title: 'Agent added to swarm',
      description: 'An agent was added to the swarm',
      metadata: {
        swarm_id: swarmId,
        agent_id: agentId,
      },
    })

    await fetchSwarm(swarmId)
  }, [isDemo, fetchSwarm])

  const removeAgentFromSwarm = useCallback(async (swarmId: string, agentId: string) => {
    if (isDemo) {
      return
    }

    const { error } = await supabase
      .from('swarm_agents')
      .delete()
      .eq('swarm_id', swarmId)
      .eq('agent_id', agentId)

    if (error) {
      console.error('Error removing agent from swarm:', error)
      throw error
    }

    await logActivity({
      type: 'agent_removed',
      title: 'Agent removed from swarm',
      description: 'An agent was removed from the swarm',
      metadata: {
        swarm_id: swarmId,
        agent_id: agentId,
      },
    })

    await fetchSwarm(swarmId)
  }, [isDemo, fetchSwarm])

  return {
    swarms,
    currentSwarm,
    messages,
    setMessages,
    fetchSwarms,
    fetchSwarm,
    createSwarm,
    updateSwarm: updateSwarmDb,
    deleteSwarm: deleteSwarmDb,
    sendMessage,
    checkOwnership,
    addAgentToSwarm,
    removeAgentFromSwarm,
  }
}
