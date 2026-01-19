import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface AgentMessage {
  id: string
  swarm_id: string
  content: string
  created_at: string
  swarm?: {
    id: string
    name: string
  }
}

export interface AgentSwarmParticipation {
  swarm_id: string
  joined_at: string
  swarm?: {
    id: string
    name: string
    status: string
    task: string | null
  }
}

export interface AgentToolUsage {
  id: string
  tool_id: string
  swarm_id: string
  action_type: string
  metadata: Record<string, any>
  used_at: string
  tool?: {
    id: string
    name: string
  }
  swarm?: {
    id: string
    name: string
  }
}

export interface AgentActivity {
  type: 'message' | 'swarm_joined' | 'tool_used'
  timestamp: string
  data: AgentMessage | AgentSwarmParticipation | AgentToolUsage
}

export interface AgentActivitySummary {
  totalMessages: number
  totalSwarms: number
  totalToolUsages: number
  activities: AgentActivity[]
  hasMore: boolean
}

const PAGE_SIZE = 20

export function useAgentActivity() {
  const [loading, setLoading] = useState(false)

  const fetchAgentMessages = async (
    agentId: string,
    limit: number = PAGE_SIZE,
    offset: number = 0
  ): Promise<{ messages: AgentMessage[]; count: number }> => {
    const { data, error, count } = await supabase
      .from('messages')
      .select(`
        id,
        swarm_id,
        content,
        created_at,
        swarm:swarms(id, name)
      `, { count: 'exact' })
      .eq('sender_id', agentId)
      .eq('sender_type', 'agent')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    const messages: AgentMessage[] = (data || []).map((item: any) => ({
      id: item.id,
      swarm_id: item.swarm_id,
      content: item.content,
      created_at: item.created_at,
      swarm: Array.isArray(item.swarm) ? item.swarm[0] : item.swarm,
    }))
    return { messages, count: count || 0 }
  }

  const fetchAgentSwarms = async (
    agentId: string,
    limit: number = PAGE_SIZE,
    offset: number = 0
  ): Promise<{ swarms: AgentSwarmParticipation[]; count: number }> => {
    const { data, error, count } = await supabase
      .from('swarm_agents')
      .select(`
        swarm_id,
        joined_at,
        swarm:swarms(id, name, status, task)
      `, { count: 'exact' })
      .eq('agent_id', agentId)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    const swarms: AgentSwarmParticipation[] = (data || []).map((item: any) => ({
      swarm_id: item.swarm_id,
      joined_at: item.joined_at,
      swarm: Array.isArray(item.swarm) ? item.swarm[0] : item.swarm,
    }))
    return { swarms, count: count || 0 }
  }

  const fetchAgentToolUsage = async (
    agentId: string,
    limit: number = PAGE_SIZE,
    offset: number = 0
  ): Promise<{ usages: AgentToolUsage[]; count: number }> => {
    const { data, error, count } = await supabase
      .from('tool_usage')
      .select(`
        id,
        tool_id,
        swarm_id,
        action_type,
        metadata,
        used_at,
        tool:tools(id, name),
        swarm:swarms(id, name)
      `, { count: 'exact' })
      .eq('agent_id', agentId)
      .order('used_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    const usages: AgentToolUsage[] = (data || []).map((item: any) => ({
      id: item.id,
      tool_id: item.tool_id,
      swarm_id: item.swarm_id,
      action_type: item.action_type,
      metadata: item.metadata,
      used_at: item.used_at,
      tool: Array.isArray(item.tool) ? item.tool[0] : item.tool,
      swarm: Array.isArray(item.swarm) ? item.swarm[0] : item.swarm,
    }))
    return { usages, count: count || 0 }
  }

  const fetchAgentActivity = useCallback(async (
    agentId: string,
    page: number = 0
  ): Promise<AgentActivitySummary> => {
    setLoading(true)
    try {
      const offset = page * PAGE_SIZE

      const [messagesResult, swarmsResult, toolsResult] = await Promise.all([
        fetchAgentMessages(agentId, PAGE_SIZE, offset),
        fetchAgentSwarms(agentId, PAGE_SIZE, offset),
        fetchAgentToolUsage(agentId, PAGE_SIZE, offset),
      ])

      const activities: AgentActivity[] = []

      messagesResult.messages.forEach((msg) => {
        activities.push({
          type: 'message',
          timestamp: msg.created_at,
          data: msg,
        })
      })

      swarmsResult.swarms.forEach((swarm) => {
        activities.push({
          type: 'swarm_joined',
          timestamp: swarm.joined_at,
          data: swarm,
        })
      })

      toolsResult.usages.forEach((usage) => {
        activities.push({
          type: 'tool_used',
          timestamp: usage.used_at,
          data: usage,
        })
      })

      activities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      const totalItems = messagesResult.count + swarmsResult.count + toolsResult.count
      const hasMore = offset + PAGE_SIZE < totalItems

      return {
        totalMessages: messagesResult.count,
        totalSwarms: swarmsResult.count,
        totalToolUsages: toolsResult.count,
        activities: activities.slice(0, PAGE_SIZE),
        hasMore,
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPaginatedMessages = useCallback(async (
    agentId: string,
    page: number = 0
  ): Promise<{ messages: AgentMessage[]; hasMore: boolean; total: number }> => {
    setLoading(true)
    try {
      const offset = page * PAGE_SIZE
      const { messages, count } = await fetchAgentMessages(agentId, PAGE_SIZE, offset)
      return {
        messages,
        hasMore: offset + PAGE_SIZE < count,
        total: count,
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPaginatedSwarms = useCallback(async (
    agentId: string,
    page: number = 0
  ): Promise<{ swarms: AgentSwarmParticipation[]; hasMore: boolean; total: number }> => {
    setLoading(true)
    try {
      const offset = page * PAGE_SIZE
      const { swarms, count } = await fetchAgentSwarms(agentId, PAGE_SIZE, offset)
      return {
        swarms,
        hasMore: offset + PAGE_SIZE < count,
        total: count,
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPaginatedToolUsage = useCallback(async (
    agentId: string,
    page: number = 0
  ): Promise<{ usages: AgentToolUsage[]; hasMore: boolean; total: number }> => {
    setLoading(true)
    try {
      const offset = page * PAGE_SIZE
      const { usages, count } = await fetchAgentToolUsage(agentId, PAGE_SIZE, offset)
      return {
        usages,
        hasMore: offset + PAGE_SIZE < count,
        total: count,
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    fetchAgentActivity,
    fetchPaginatedMessages,
    fetchPaginatedSwarms,
    fetchPaginatedToolUsage,
  }
}
