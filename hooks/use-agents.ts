'use client'

import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { sanitizeAgentName, sanitizeAgentPrompt, sanitizeText } from '@/lib/sanitize'
import type { Agent } from '@/lib/supabase'

export interface DuplicateAgentResult {
  agent: Agent
  toolsCopied: number
}

export interface AgentExport {
  version: string
  exportedAt: string
  agent: {
    name: string
    role: string | null
    framework: string | null
    model: string | null
    system_prompt: string | null
    settings: Record<string, unknown> | null
  }
}

export interface ImportAgentResult {
  agent: Agent
  warnings: string[]
}

export function useAgents() {
  const {
    agents,
    setAgents,
    addAgent,
    updateAgent,
    removeAgent,
    isDemo,
  } = useStore()

  const fetchAgents = useCallback(async () => {
    if (isDemo) return

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agents:', error)
      return
    }

    setAgents(data || [])
  }, [isDemo, setAgents])

  const createAgent = useCallback(async (agentData: Omit<Agent, 'id' | 'user_id' | 'created_at'>) => {
    const sanitizedData = {
      ...agentData,
      name: sanitizeAgentName(agentData.name),
      role: agentData.role ? sanitizeText(agentData.role) : null,
      system_prompt: agentData.system_prompt ? sanitizeAgentPrompt(agentData.system_prompt) : null,
    }

    if (!sanitizedData.name) {
      throw new Error('Agent name cannot be empty')
    }

    if (isDemo) {
      const newAgent: Agent = {
        ...sanitizedData,
        id: `demo_agent_${Date.now()}`,
        user_id: 'demo',
        created_at: new Date().toISOString(),
      }
      addAgent(newAgent)
      return newAgent
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('You must be logged in to create an agent')
    }

    const { data, error } = await supabase
      .from('agents')
      .insert({ ...sanitizedData, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('Error creating agent:', error)
      throw error
    }

    addAgent(data)
    return data
  }, [isDemo, addAgent])

  const editAgent = useCallback(async (id: string, updates: Partial<Agent>) => {
    const sanitizedUpdates: Partial<Agent> = { ...updates }

    if (updates.name !== undefined) {
      sanitizedUpdates.name = sanitizeAgentName(updates.name)
      if (!sanitizedUpdates.name) {
        throw new Error('Agent name cannot be empty')
      }
    }
    if (updates.role !== undefined) {
      sanitizedUpdates.role = updates.role ? sanitizeText(updates.role) : null
    }
    if (updates.system_prompt !== undefined) {
      sanitizedUpdates.system_prompt = updates.system_prompt
        ? sanitizeAgentPrompt(updates.system_prompt)
        : null
    }

    if (isDemo) {
      updateAgent(id, sanitizedUpdates)
      return
    }

    const { error } = await supabase
      .from('agents')
      .update(sanitizedUpdates)
      .eq('id', id)

    if (error) {
      console.error('Error updating agent:', error)
      throw error
    }

    updateAgent(id, sanitizedUpdates)
  }, [isDemo, updateAgent])

  const deleteAgent = useCallback(async (id: string) => {
    if (isDemo) {
      removeAgent(id)
      return
    }

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting agent:', error)
      throw error
    }

    removeAgent(id)
  }, [isDemo, removeAgent])

  const duplicateAgent = useCallback(async (agent: Agent): Promise<DuplicateAgentResult> => {
    const newName = `${agent.name} (Copy)`

    const agentData = {
      name: newName,
      role: agent.role,
      framework: agent.framework,
      model: agent.model,
      system_prompt: agent.system_prompt,
      settings: agent.settings,
    }

    if (isDemo) {
      const newAgent: Agent = {
        ...agentData,
        id: `demo_agent_${Date.now()}`,
        user_id: 'demo',
        created_at: new Date().toISOString(),
      }
      addAgent(newAgent)
      return { agent: newAgent, toolsCopied: 0 }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('You must be logged in to duplicate an agent')
    }

    const { data: newAgent, error: agentError } = await supabase
      .from('agents')
      .insert({ ...agentData, user_id: user.id })
      .select()
      .single()

    if (agentError) {
      console.error('Error duplicating agent:', agentError)
      throw agentError
    }

    const { data: existingTools } = await supabase
      .from('agent_tools')
      .select('tool_id, enabled')
      .eq('agent_id', agent.id)

    let toolsCopied = 0
    if (existingTools && existingTools.length > 0) {
      const toolAssignments = existingTools.map((t) => ({
        agent_id: newAgent.id,
        tool_id: t.tool_id,
        enabled: t.enabled,
      }))

      const { error: toolsError } = await supabase
        .from('agent_tools')
        .insert(toolAssignments)

      if (!toolsError) {
        toolsCopied = existingTools.length
      }
    }

    addAgent(newAgent)
    return { agent: newAgent, toolsCopied }
  }, [isDemo, addAgent])

  const exportAgent = useCallback((agent: Agent): AgentExport => {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      agent: {
        name: agent.name,
        role: agent.role,
        framework: agent.framework,
        model: agent.model,
        system_prompt: agent.system_prompt,
        settings: agent.settings,
      },
    }
  }, [])

  const downloadAgentExport = useCallback((agent: Agent) => {
    const exportData = exportAgent(agent)
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-agent.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [exportAgent])

  const validateAgentImport = useCallback((data: unknown): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Invalid JSON structure'] }
    }

    const obj = data as Record<string, unknown>

    if (!obj.version || typeof obj.version !== 'string') {
      errors.push('Missing or invalid version field')
    }

    if (!obj.agent || typeof obj.agent !== 'object') {
      return { valid: false, errors: ['Missing agent configuration'] }
    }

    const agent = obj.agent as Record<string, unknown>

    if (!agent.name || typeof agent.name !== 'string') {
      errors.push('Missing or invalid agent name')
    }

    if (agent.role !== undefined && agent.role !== null && typeof agent.role !== 'string') {
      errors.push('Invalid agent role format')
    }

    if (agent.framework !== undefined && agent.framework !== null && typeof agent.framework !== 'string') {
      errors.push('Invalid agent framework format')
    }

    if (agent.model !== undefined && agent.model !== null && typeof agent.model !== 'string') {
      errors.push('Invalid agent model format')
    }

    if (agent.system_prompt !== undefined && agent.system_prompt !== null && typeof agent.system_prompt !== 'string') {
      errors.push('Invalid system prompt format')
    }

    if (agent.settings !== undefined && agent.settings !== null && typeof agent.settings !== 'object') {
      errors.push('Invalid settings format')
    }

    return { valid: errors.length === 0, errors }
  }, [])

  const importAgent = useCallback(async (jsonData: string): Promise<ImportAgentResult> => {
    const warnings: string[] = []

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonData)
    } catch {
      throw new Error('Invalid JSON format')
    }

    const validation = validateAgentImport(parsed)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    const exportData = parsed as AgentExport

    if (exportData.version !== '1.0') {
      warnings.push(`Import version ${exportData.version} may have compatibility issues`)
    }

    const existingNames = agents.map((a) => a.name.toLowerCase())
    let finalName = exportData.agent.name
    if (existingNames.includes(finalName.toLowerCase())) {
      finalName = `${exportData.agent.name} (Imported)`
      warnings.push('Agent name already exists, renamed to avoid conflict')
    }

    const agentData = {
      name: finalName,
      role: exportData.agent.role || null,
      framework: exportData.agent.framework || 'anthropic',
      model: exportData.agent.model || null,
      system_prompt: exportData.agent.system_prompt || null,
      settings: exportData.agent.settings || {},
    }

    if (isDemo) {
      const newAgent: Agent = {
        ...agentData,
        id: `demo_agent_${Date.now()}`,
        user_id: 'demo',
        created_at: new Date().toISOString(),
      }
      addAgent(newAgent)
      return { agent: newAgent, warnings }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('You must be logged in to import an agent')
    }

    const { data: newAgent, error } = await supabase
      .from('agents')
      .insert({ ...agentData, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('Error importing agent:', error)
      throw error
    }

    addAgent(newAgent)
    return { agent: newAgent, warnings }
  }, [isDemo, addAgent, agents, validateAgentImport])

  return {
    agents,
    fetchAgents,
    createAgent,
    editAgent,
    deleteAgent,
    duplicateAgent,
    exportAgent,
    downloadAgentExport,
    validateAgentImport,
    importAgent,
  }
}
