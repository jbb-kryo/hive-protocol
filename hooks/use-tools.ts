import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Tool {
  id: string
  name: string
  description: string
  capabilities: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
  is_custom?: boolean
  is_system?: boolean
  input_schema?: Record<string, any>
  output_schema?: Record<string, any>
  wrapper_code?: string
  icon?: string
  category?: string
  status?: string
  version?: number
}

export interface SwarmTool {
  id: string
  swarm_id: string
  tool_id: string
  assigned_at: string
  tool?: Tool
}

export interface ToolUsage {
  id: string
  tool_id: string
  swarm_id: string
  action_type: string
  metadata: Record<string, any>
  used_at: string
}

export interface AgentTool {
  id: string
  agent_id: string
  tool_id: string
  enabled: boolean
  settings: Record<string, any>
  assigned_at: string
  tool?: Tool
}

export interface UserTool {
  id: string
  user_id: string
  tool_id: string
  enabled: boolean
  configuration: Record<string, any>
  created_at: string
  updated_at: string
  tool?: Tool
}

export interface ConfigField {
  name: string
  type: 'text' | 'password' | 'number' | 'select' | 'multiselect' | 'toggle'
  label: string
  required: boolean
  options?: string[]
  default?: any
  min?: number
  max?: number
  placeholder?: string
  show_if?: {
    field: string
    value: string | string[]
  }
}

export function useTools() {
  const [tools, setTools] = useState<Tool[]>([])
  const [userTools, setUserTools] = useState<UserTool[]>([])
  const [loading, setLoading] = useState(true)
  const [userToolsLoading, setUserToolsLoading] = useState(true)

  const fetchTools = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTools(data || [])
    } catch (error) {
      console.error('Error fetching tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserTools = async () => {
    try {
      setUserToolsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_tools')
        .select(`
          *,
          tool:tools(*)
        `)
        .eq('user_id', user.id)

      if (error) throw error
      setUserTools(data || [])
    } catch (error) {
      console.error('Error fetching user tools:', error)
    } finally {
      setUserToolsLoading(false)
    }
  }

  const getUserToolStatus = (toolId: string): { enabled: boolean; configuration: Record<string, any> } | null => {
    const userTool = userTools.find((ut) => ut.tool_id === toolId)
    if (!userTool) return null
    return { enabled: userTool.enabled, configuration: userTool.configuration }
  }

  const toggleUserTool = async (toolId: string, enabled: boolean): Promise<UserTool | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const existing = userTools.find((ut) => ut.tool_id === toolId)

      if (existing) {
        const { data, error } = await supabase
          .from('user_tools')
          .update({ enabled })
          .eq('user_id', user.id)
          .eq('tool_id', toolId)
          .select(`
            *,
            tool:tools(*)
          `)
          .single()

        if (error) throw error
        setUserTools(userTools.map((ut) => ut.tool_id === toolId ? data : ut))
        return data
      } else {
        const { data, error } = await supabase
          .from('user_tools')
          .insert([{
            user_id: user.id,
            tool_id: toolId,
            enabled,
          }])
          .select(`
            *,
            tool:tools(*)
          `)
          .single()

        if (error) throw error
        setUserTools([...userTools, data])
        return data
      }
    } catch (error) {
      console.error('Error toggling user tool:', error)
      throw error
    }
  }

  const configureUserTool = async (toolId: string, configuration: Record<string, any>): Promise<UserTool | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const existing = userTools.find((ut) => ut.tool_id === toolId)

      if (existing) {
        const { data, error } = await supabase
          .from('user_tools')
          .update({ configuration, enabled: true })
          .eq('user_id', user.id)
          .eq('tool_id', toolId)
          .select(`
            *,
            tool:tools(*)
          `)
          .single()

        if (error) throw error
        setUserTools(userTools.map((ut) => ut.tool_id === toolId ? data : ut))
        return data
      } else {
        const { data, error } = await supabase
          .from('user_tools')
          .insert([{
            user_id: user.id,
            tool_id: toolId,
            configuration,
            enabled: true,
          }])
          .select(`
            *,
            tool:tools(*)
          `)
          .single()

        if (error) throw error
        setUserTools([...userTools, data])
        return data
      }
    } catch (error) {
      console.error('Error configuring user tool:', error)
      throw error
    }
  }

  const createTool = async (tool: Omit<Tool, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tools')
        .insert([{
          ...tool,
          created_by: user.id,
        }])
        .select()
        .single()

      if (error) throw error

      setTools([data, ...tools])
      return data
    } catch (error) {
      console.error('Error creating tool:', error)
      throw error
    }
  }

  const updateTool = async (id: string, updates: Partial<Tool>) => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setTools(tools.map(t => t.id === id ? data : t))
      return data
    } catch (error) {
      console.error('Error updating tool:', error)
      throw error
    }
  }

  const deleteTool = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTools(tools.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting tool:', error)
      throw error
    }
  }

  const fetchSwarmTools = async (swarmId: string): Promise<Tool[]> => {
    try {
      const { data, error } = await supabase
        .from('swarm_tools')
        .select(`
          *,
          tool:tools(*)
        `)
        .eq('swarm_id', swarmId)

      if (error) throw error

      return (data || []).map((st: any) => st.tool).filter(Boolean)
    } catch (error) {
      console.error('Error fetching swarm tools:', error)
      return []
    }
  }

  const assignToolToSwarm = async (swarmId: string, toolId: string) => {
    try {
      const { error } = await supabase
        .from('swarm_tools')
        .insert([{
          swarm_id: swarmId,
          tool_id: toolId,
        }])

      if (error) throw error
    } catch (error) {
      console.error('Error assigning tool to swarm:', error)
      throw error
    }
  }

  const removeToolFromSwarm = async (swarmId: string, toolId: string) => {
    try {
      const { error } = await supabase
        .from('swarm_tools')
        .delete()
        .eq('swarm_id', swarmId)
        .eq('tool_id', toolId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing tool from swarm:', error)
      throw error
    }
  }

  const logToolUsage = async (
    toolId: string,
    swarmId: string,
    actionType: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      const { error } = await supabase
        .from('tool_usage')
        .insert([{
          tool_id: toolId,
          swarm_id: swarmId,
          action_type: actionType,
          metadata,
        }])

      if (error) throw error
    } catch (error) {
      console.error('Error logging tool usage:', error)
    }
  }

  const fetchToolUsage = async (swarmId: string): Promise<ToolUsage[]> => {
    try {
      const { data, error } = await supabase
        .from('tool_usage')
        .select('*')
        .eq('swarm_id', swarmId)
        .order('used_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching tool usage:', error)
      return []
    }
  }

  const fetchAgentTools = async (agentId: string): Promise<AgentTool[]> => {
    try {
      const { data, error } = await supabase
        .from('agent_tools')
        .select(`
          *,
          tool:tools(*)
        `)
        .eq('agent_id', agentId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching agent tools:', error)
      return []
    }
  }

  const assignToolToAgent = async (agentId: string, toolId: string, enabled: boolean = true) => {
    try {
      const { data, error } = await supabase
        .from('agent_tools')
        .insert([{
          agent_id: agentId,
          tool_id: toolId,
          enabled,
        }])
        .select(`
          *,
          tool:tools(*)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error assigning tool to agent:', error)
      throw error
    }
  }

  const updateAgentTool = async (agentId: string, toolId: string, updates: { enabled?: boolean; settings?: Record<string, any> }) => {
    try {
      const { data, error } = await supabase
        .from('agent_tools')
        .update(updates)
        .eq('agent_id', agentId)
        .eq('tool_id', toolId)
        .select(`
          *,
          tool:tools(*)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating agent tool:', error)
      throw error
    }
  }

  const removeToolFromAgent = async (agentId: string, toolId: string) => {
    try {
      const { error } = await supabase
        .from('agent_tools')
        .delete()
        .eq('agent_id', agentId)
        .eq('tool_id', toolId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing tool from agent:', error)
      throw error
    }
  }

  const toggleAgentTool = async (agentId: string, toolId: string, enabled: boolean): Promise<AgentTool | null> => {
    try {
      const { data: existing } = await supabase
        .from('agent_tools')
        .select('id')
        .eq('agent_id', agentId)
        .eq('tool_id', toolId)
        .maybeSingle()

      if (existing) {
        return await updateAgentTool(agentId, toolId, { enabled })
      } else {
        return await assignToolToAgent(agentId, toolId, enabled)
      }
    } catch (error) {
      console.error('Error toggling agent tool:', error)
      throw error
    }
  }

  const getAgentEnabledTools = async (agentId: string): Promise<Tool[]> => {
    try {
      const { data, error } = await supabase
        .from('agent_tools')
        .select(`
          tool:tools(*)
        `)
        .eq('agent_id', agentId)
        .eq('enabled', true)

      if (error) throw error
      return (data || []).map((at: any) => at.tool).filter(Boolean)
    } catch (error) {
      console.error('Error fetching agent enabled tools:', error)
      return []
    }
  }

  useEffect(() => {
    fetchTools()
    fetchUserTools()
  }, [])

  return {
    tools,
    loading,
    userTools,
    userToolsLoading,
    fetchTools,
    fetchUserTools,
    getUserToolStatus,
    toggleUserTool,
    configureUserTool,
    createTool,
    updateTool,
    deleteTool,
    fetchSwarmTools,
    assignToolToSwarm,
    removeToolFromSwarm,
    logToolUsage,
    fetchToolUsage,
    fetchAgentTools,
    assignToolToAgent,
    updateAgentTool,
    removeToolFromAgent,
    toggleAgentTool,
    getAgentEnabledTools,
  }
}
