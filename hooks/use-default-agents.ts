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
  version: string
  changelog: string | null
  previous_version_id: string | null
  is_featured: boolean
  featured_until: string | null
  featured_at: string | null
  average_rating: number
  review_count: number
  clone_count: number
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
  version?: string
  changelog?: string
}

export interface TemplateVersionInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  changelog: string | null
  templateId: string
}

export interface BatchDeployResult {
  swarmId: string
  agentId?: string
  success: boolean
  error?: string
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
        source_template_id: template.id,
        source_template_version: template.version,
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
        source_template_id: template.id,
        source_template_version: template.version,
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
      version: data.version || '1.0.0',
      changelog: data.changelog || 'Initial release',
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
    if (updates.version !== undefined) {
      sanitizedUpdates.version = updates.version
    }
    if (updates.changelog !== undefined) {
      sanitizedUpdates.changelog = updates.changelog
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

  const createNewVersion = useCallback(async (
    templateId: string,
    newVersion: string,
    changelog: string,
    updates: Partial<CreateTemplateData>
  ) => {
    const currentTemplate = templates.find(t => t.id === templateId)
    if (!currentTemplate) throw new Error('Template not found')

    const sanitizedUpdates: Record<string, unknown> = {
      version: newVersion,
      changelog: changelog,
      previous_version_id: templateId,
      updated_at: new Date().toISOString(),
    }

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

    const { data: updated, error: updateError } = await supabase
      .from('default_agents')
      .update(sanitizedUpdates)
      .eq('id', templateId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    setTemplates(prev => prev.map(t => t.id === templateId ? updated : t))
    return updated
  }, [templates])

  const getVersionHistory = useCallback(async (templateId: string): Promise<DefaultAgent[]> => {
    const history: DefaultAgent[] = []
    let currentId: string | null = templateId

    while (currentId) {
      const result = await supabase
        .from('default_agents')
        .select('*')
        .eq('id', currentId)
        .maybeSingle()

      const versionData = result.data as DefaultAgent | null
      if (versionData) {
        history.push(versionData)
        currentId = versionData.previous_version_id
      } else {
        currentId = null
      }
    }

    return history
  }, [])

  const checkForUpdates = useCallback(async (
    sourceTemplateId: string,
    currentVersion: string
  ): Promise<TemplateVersionInfo | null> => {
    const { data: template } = await supabase
      .from('default_agents')
      .select('id, version, changelog')
      .eq('id', sourceTemplateId)
      .maybeSingle()

    if (!template) return null

    const hasUpdate = template.version !== currentVersion &&
      compareVersions(template.version, currentVersion) > 0

    return {
      currentVersion,
      latestVersion: template.version,
      hasUpdate,
      changelog: template.changelog,
      templateId: sourceTemplateId,
    }
  }, [])

  const upgradeAgent = useCallback(async (
    agentId: string,
    templateId: string,
    preserveCustomizations: boolean = true
  ) => {
    const { data: template } = await supabase
      .from('default_agents')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!template) throw new Error('Template not found')

    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (!agent) throw new Error('Agent not found')

    const updates: Record<string, unknown> = {
      source_template_version: template.version,
    }

    if (!preserveCustomizations) {
      updates.system_prompt = template.system_prompt
      updates.settings = template.settings
      updates.role = template.role
    }

    const { data: updated, error: updateError } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return updated
  }, [])

  const rollbackTemplate = useCallback(async (templateId: string) => {
    const { data: currentTemplate } = await supabase
      .from('default_agents')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!currentTemplate?.previous_version_id) {
      throw new Error('No previous version available')
    }

    const history = await getVersionHistory(currentTemplate.previous_version_id)
    if (history.length === 0) {
      throw new Error('Previous version not found')
    }

    const previousVersion = history[0]

    const { data: updated, error: updateError } = await supabase
      .from('default_agents')
      .update({
        version: previousVersion.version,
        changelog: `Rolled back from ${currentTemplate.version}`,
        system_prompt: previousVersion.system_prompt,
        settings: previousVersion.settings,
        description: previousVersion.description,
        tags: previousVersion.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    setTemplates(prev => prev.map(t => t.id === templateId ? updated : t))
    return updated
  }, [getVersionHistory])

  const batchDeployToSwarms = useCallback(async (
    template: DefaultAgent,
    swarmIds: string[],
    onProgress?: (completed: number, total: number, result: BatchDeployResult) => void
  ): Promise<BatchDeployResult[]> => {
    const results: BatchDeployResult[] = []

    for (let i = 0; i < swarmIds.length; i++) {
      const swarmId = swarmIds[i]
      try {
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .insert({
            name: template.name,
            role: template.role,
            framework: template.framework,
            system_prompt: template.system_prompt,
            settings: template.settings || {},
            source_template_id: template.id,
            source_template_version: template.version,
          })
          .select()
          .single()

        if (agentError) throw agentError

        const { error: linkError } = await supabase
          .from('swarm_agents')
          .insert({
            swarm_id: swarmId,
            agent_id: agent.id,
          })

        if (linkError) throw linkError

        const result: BatchDeployResult = {
          swarmId,
          agentId: agent.id,
          success: true,
        }
        results.push(result)
        onProgress?.(i + 1, swarmIds.length, result)
      } catch (err) {
        const result: BatchDeployResult = {
          swarmId,
          success: false,
          error: err instanceof Error ? err.message : 'Deployment failed',
        }
        results.push(result)
        onProgress?.(i + 1, swarmIds.length, result)
      }
    }

    return results
  }, [])

  const fetchFeaturedTemplates = useCallback(async (): Promise<DefaultAgent[]> => {
    const now = new Date().toISOString()
    const { data, error: fetchError } = await supabase
      .from('default_agents')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .or(`featured_until.is.null,featured_until.gt.${now}`)
      .order('featured_at', { ascending: false })
      .limit(6)

    if (fetchError) {
      console.error('Error fetching featured templates:', fetchError)
      return []
    }
    return data || []
  }, [])

  const setFeatured = useCallback(async (id: string, featuredUntil?: string | null) => {
    const { data: currentFeatured } = await supabase
      .from('default_agents')
      .select('id')
      .eq('is_featured', true)

    if (currentFeatured && currentFeatured.length >= 6) {
      const template = currentFeatured.find(t => t.id === id)
      if (!template) {
        throw new Error('Maximum of 6 featured templates reached. Unfeature one first.')
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('default_agents')
      .update({
        is_featured: true,
        featured_at: new Date().toISOString(),
        featured_until: featuredUntil || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError
    setTemplates(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [])

  const unsetFeatured = useCallback(async (id: string) => {
    const { data: updated, error: updateError } = await supabase
      .from('default_agents')
      .update({
        is_featured: false,
        featured_at: null,
        featured_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError
    setTemplates(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [])

  const getFeaturedCount = useCallback(async (): Promise<number> => {
    const { data } = await supabase
      .from('default_agents')
      .select('id')
      .eq('is_featured', true)

    return data?.length || 0
  }, [])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    fetchAllTemplates,
    fetchFeaturedTemplates,
    cloneTemplate,
    createTemplate,
    updateTemplate,
    toggleTemplateActive,
    deleteTemplate,
    reorderTemplates,
    getCategories,
    getTemplatesByCategory,
    searchTemplates,
    createNewVersion,
    getVersionHistory,
    checkForUpdates,
    upgradeAgent,
    rollbackTemplate,
    batchDeployToSwarms,
    setFeatured,
    unsetFeatured,
    getFeaturedCount,
  }
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    if (p1 > p2) return 1
    if (p1 < p2) return -1
  }
  return 0
}
