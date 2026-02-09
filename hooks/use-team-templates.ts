'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { sanitizeAgentName, sanitizeAgentPrompt, sanitizeText } from '@/lib/sanitize'

export interface TeamTemplate {
  id: string
  organization_id: string
  created_by: string
  name: string
  role: string | null
  framework: string
  model_id: string | null
  system_prompt: string | null
  description: string | null
  tags: string[]
  category: string
  icon: string
  settings: Record<string, unknown> | null
  permission_level: 'view' | 'use' | 'edit'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateTeamTemplateData {
  organization_id: string
  name: string
  role?: string
  framework?: string
  system_prompt?: string
  description?: string
  tags?: string[]
  category?: string
  icon?: string
  settings?: Record<string, unknown>
  permission_level?: 'view' | 'use' | 'edit'
}

export interface UpdateTeamTemplateData {
  name?: string
  role?: string
  framework?: string
  system_prompt?: string
  description?: string
  tags?: string[]
  category?: string
  icon?: string
  settings?: Record<string, unknown>
  permission_level?: 'view' | 'use' | 'edit'
  is_active?: boolean
}

export function useTeamTemplates(organizationId: string | null) {
  const { addAgent, isDemo } = useStore()
  const [templates, setTemplates] = useState<TeamTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async (category?: string) => {
    if (!organizationId) return []
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('team_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setTemplates(data || [])
      return data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team templates'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  const fetchAllTemplates = useCallback(async () => {
    if (!organizationId) return []
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('team_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setTemplates(data || [])
      return data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team templates'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  const createTemplate = useCallback(async (data: CreateTeamTemplateData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const sanitizedData = {
      organization_id: data.organization_id,
      created_by: user.id,
      name: sanitizeAgentName(data.name),
      role: data.role ? sanitizeText(data.role) : null,
      framework: data.framework || 'anthropic',
      system_prompt: data.system_prompt ? sanitizeAgentPrompt(data.system_prompt) : null,
      description: data.description ? sanitizeText(data.description) : null,
      tags: data.tags || [],
      category: data.category || 'general',
      icon: data.icon || 'Bot',
      settings: data.settings || {},
      permission_level: data.permission_level || 'use',
      is_active: true,
    }

    const { data: newTemplate, error: insertError } = await supabase
      .from('team_templates')
      .insert(sanitizedData)
      .select()
      .single()

    if (insertError) throw insertError

    setTemplates(prev => [newTemplate, ...prev])
    return newTemplate
  }, [])

  const updateTemplate = useCallback(async (id: string, updates: UpdateTeamTemplateData) => {
    const sanitizedUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) sanitizedUpdates.name = sanitizeAgentName(updates.name)
    if (updates.role !== undefined) sanitizedUpdates.role = updates.role ? sanitizeText(updates.role) : null
    if (updates.framework !== undefined) sanitizedUpdates.framework = updates.framework
    if (updates.system_prompt !== undefined) sanitizedUpdates.system_prompt = updates.system_prompt ? sanitizeAgentPrompt(updates.system_prompt) : null
    if (updates.description !== undefined) sanitizedUpdates.description = updates.description ? sanitizeText(updates.description) : null
    if (updates.tags !== undefined) sanitizedUpdates.tags = updates.tags
    if (updates.category !== undefined) sanitizedUpdates.category = updates.category
    if (updates.icon !== undefined) sanitizedUpdates.icon = updates.icon
    if (updates.settings !== undefined) sanitizedUpdates.settings = updates.settings
    if (updates.permission_level !== undefined) sanitizedUpdates.permission_level = updates.permission_level
    if (updates.is_active !== undefined) sanitizedUpdates.is_active = updates.is_active

    const { data: updated, error: updateError } = await supabase
      .from('team_templates')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    setTemplates(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('team_templates')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    setTemplates(prev => prev.filter(t => t.id !== id))
  }, [])

  const cloneToAgent = useCallback(async (template: TeamTemplate) => {
    if (isDemo) {
      const newAgent = {
        id: `demo_agent_${Date.now()}`,
        user_id: 'demo',
        name: template.name,
        role: template.role,
        framework: template.framework,
        model: null,
        system_prompt: template.system_prompt,
        settings: template.settings || {},
        created_at: new Date().toISOString(),
      }
      addAgent(newAgent)
      return newAgent
    }

    const { data, error: insertError } = await supabase
      .from('agents')
      .insert({
        name: template.name,
        role: template.role,
        framework: template.framework,
        system_prompt: template.system_prompt,
        settings: template.settings || {},
      })
      .select()
      .single()

    if (insertError) throw insertError

    addAgent(data)
    return data
  }, [isDemo, addAgent])

  const searchTemplates = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      t.role?.toLowerCase().includes(lowerQuery)
    )
  }, [templates])

  const getCategories = useCallback(() => {
    const categories = new Set(templates.map(t => t.category))
    return Array.from(categories).sort()
  }, [templates])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    fetchAllTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    cloneToAgent,
    searchTemplates,
    getCategories,
  }
}
