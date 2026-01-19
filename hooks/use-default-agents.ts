'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { sanitizeAgentName, sanitizeAgentPrompt, sanitizeText } from '@/lib/sanitize'

export interface DefaultAgent {
  id: string
  name: string
  role: string | null
  framework: string
  model_id: string | null
  system_prompt: string | null
  settings: Record<string, unknown> | null
  is_active: boolean
  sort_order: number
  description: string | null
  tags: string[]
  category: string
  icon: string
  created_at: string
  updated_at: string
}

export interface CreateTemplateData {
  name: string
  role?: string
  framework: string
  system_prompt?: string
  settings?: Record<string, unknown>
  description?: string
  tags?: string[]
  category?: string
  icon?: string
}

export function useDefaultAgents() {
  const { addAgent, isDemo } = useStore()
  const [templates, setTemplates] = useState<DefaultAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async (category?: string) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('default_agents')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setTemplates(data || [])
      return data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch templates'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAllTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('default_agents')
        .select('*')
        .order('sort_order', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setTemplates(data || [])
      return data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch templates'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const cloneTemplate = useCallback(async (template: DefaultAgent) => {
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

    if (insertError) {
      throw insertError
    }

    addAgent(data)
    return data
  }, [isDemo, addAgent])

  const createTemplate = useCallback(async (data: CreateTemplateData) => {
    const sanitizedData = {
      name: sanitizeAgentName(data.name),
      role: data.role ? sanitizeText(data.role) : null,
      framework: data.framework,
      system_prompt: data.system_prompt ? sanitizeAgentPrompt(data.system_prompt) : null,
      settings: data.settings || {},
      description: data.description ? sanitizeText(data.description) : null,
      tags: data.tags || [],
      category: data.category || 'general',
      icon: data.icon || 'Bot',
      is_active: true,
      sort_order: templates.length + 1,
    }

    const { data: newTemplate, error: insertError } = await supabase
      .from('default_agents')
      .insert(sanitizedData)
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    setTemplates(prev => [...prev, newTemplate])
    return newTemplate
  }, [templates.length])

  const updateTemplate = useCallback(async (id: string, updates: Partial<CreateTemplateData>) => {
    const sanitizedUpdates: Record<string, unknown> = {}

    if (updates.name !== undefined) {
      sanitizedUpdates.name = sanitizeAgentName(updates.name)
    }
    if (updates.role !== undefined) {
      sanitizedUpdates.role = updates.role ? sanitizeText(updates.role) : null
    }
    if (updates.framework !== undefined) {
      sanitizedUpdates.framework = updates.framework
    }
    if (updates.system_prompt !== undefined) {
      sanitizedUpdates.system_prompt = updates.system_prompt ? sanitizeAgentPrompt(updates.system_prompt) : null
    }
    if (updates.settings !== undefined) {
      sanitizedUpdates.settings = updates.settings
    }
    if (updates.description !== undefined) {
      sanitizedUpdates.description = updates.description ? sanitizeText(updates.description) : null
    }
    if (updates.tags !== undefined) {
      sanitizedUpdates.tags = updates.tags
    }
    if (updates.category !== undefined) {
      sanitizedUpdates.category = updates.category
    }
    if (updates.icon !== undefined) {
      sanitizedUpdates.icon = updates.icon
    }

    sanitizedUpdates.updated_at = new Date().toISOString()

    const { data: updated, error: updateError } = await supabase
      .from('default_agents')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    setTemplates(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [])

  const toggleTemplateActive = useCallback(async (id: string, isActive: boolean) => {
    const { error: updateError } = await supabase
      .from('default_agents')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: isActive } : t))
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('default_agents')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    setTemplates(prev => prev.filter(t => t.id !== id))
  }, [])

  const reorderTemplates = useCallback(async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index + 1,
    }))

    for (const update of updates) {
      await supabase
        .from('default_agents')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }

    setTemplates(prev => {
      const sorted = [...prev].sort((a, b) => {
        const aIndex = orderedIds.indexOf(a.id)
        const bIndex = orderedIds.indexOf(b.id)
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
      return sorted.map((t, i) => ({ ...t, sort_order: i + 1 }))
    })
  }, [])

  const getCategories = useCallback(() => {
    const categories = new Set(templates.map(t => t.category))
    return Array.from(categories).sort()
  }, [templates])

  const getTemplatesByCategory = useCallback((category: string) => {
    if (category === 'all') return templates
    return templates.filter(t => t.category === category)
  }, [templates])

  const searchTemplates = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      t.role?.toLowerCase().includes(lowerQuery)
    )
  }, [templates])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    fetchAllTemplates,
    cloneTemplate,
    createTemplate,
    updateTemplate,
    toggleTemplateActive,
    deleteTemplate,
    reorderTemplates,
    getCategories,
    getTemplatesByCategory,
    searchTemplates,
  }
}
