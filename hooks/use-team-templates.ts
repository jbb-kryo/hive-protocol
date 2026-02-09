'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { sanitizeAgentName, sanitizeAgentPrompt, sanitizeText } from '@/lib/sanitize'
import { getParametersFromSettings, substituteVariables } from '@/lib/template-parameters'
import {
  resolveTemplate as resolveInheritance,
  buildTemplatesMap,
  wouldCreateCircularRef,
  type ResolvedTemplate,
} from '@/lib/template-inheritance'

export type TemplateStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'changes_requested'

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
  status: TemplateStatus
  submitted_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_feedback: string | null
  parent_template_id: string | null
  inheritance_mode: 'inherit' | 'compose'
  override_fields: string[]
  created_at: string
  updated_at: string
}

export interface ApprovalHistoryEntry {
  id: string
  template_id: string
  action: string
  performed_by: string
  feedback: string | null
  previous_status: string
  new_status: string
  created_at: string
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
  parent_template_id?: string | null
  inheritance_mode?: 'inherit' | 'compose'
  override_fields?: string[]
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
  parent_template_id?: string | null
  inheritance_mode?: 'inherit' | 'compose'
  override_fields?: string[]
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

  const fetchPendingReview = useCallback(async () => {
    if (!organizationId) return []
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('team_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending_review')
        .order('submitted_at', { ascending: true })

      if (fetchError) throw fetchError

      return data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pending templates'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  const createTemplate = useCallback(async (data: CreateTeamTemplateData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const sanitizedData: Record<string, unknown> = {
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
      status: 'draft',
      parent_template_id: data.parent_template_id || null,
      inheritance_mode: data.inheritance_mode || 'inherit',
      override_fields: data.override_fields || [],
    }

    const { data: newTemplate, error: insertError } = await supabase
      .from('team_templates')
      .insert(sanitizedData)
      .select()
      .single()

    if (insertError) throw insertError

    await supabase.from('template_approval_history').insert({
      template_id: newTemplate.id,
      action: 'draft_created',
      performed_by: user.id,
      previous_status: 'draft',
      new_status: 'draft',
    })

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
    if (updates.parent_template_id !== undefined) sanitizedUpdates.parent_template_id = updates.parent_template_id || null
    if (updates.inheritance_mode !== undefined) sanitizedUpdates.inheritance_mode = updates.inheritance_mode
    if (updates.override_fields !== undefined) sanitizedUpdates.override_fields = updates.override_fields

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

  const submitForReview = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const template = templates.find(t => t.id === id)
    const prevStatus = template?.status || 'draft'

    const { data: updated, error: updateError } = await supabase
      .from('team_templates')
      .update({
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
        review_feedback: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    const action = prevStatus === 'changes_requested' || prevStatus === 'rejected'
      ? 'resubmitted'
      : 'submitted'

    await supabase.from('template_approval_history').insert({
      template_id: id,
      action,
      performed_by: user.id,
      previous_status: prevStatus,
      new_status: 'pending_review',
    })

    setTemplates(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [templates])

  const approveTemplate = useCallback(async (id: string, feedback?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const template = templates.find(t => t.id === id)
    const prevStatus = template?.status || 'pending_review'

    const { data: updated, error: updateError } = await supabase
      .from('team_templates')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_feedback: feedback || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    await supabase.from('template_approval_history').insert({
      template_id: id,
      action: 'approved',
      performed_by: user.id,
      feedback: feedback || null,
      previous_status: prevStatus,
      new_status: 'approved',
    })

    setTemplates(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [templates])

  const rejectTemplate = useCallback(async (id: string, feedback: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const template = templates.find(t => t.id === id)
    const prevStatus = template?.status || 'pending_review'

    const { data: updated, error: updateError } = await supabase
      .from('team_templates')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_feedback: feedback,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    await supabase.from('template_approval_history').insert({
      template_id: id,
      action: 'rejected',
      performed_by: user.id,
      feedback,
      previous_status: prevStatus,
      new_status: 'rejected',
    })

    setTemplates(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [templates])

  const requestChanges = useCallback(async (id: string, feedback: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const template = templates.find(t => t.id === id)
    const prevStatus = template?.status || 'pending_review'

    const { data: updated, error: updateError } = await supabase
      .from('team_templates')
      .update({
        status: 'changes_requested',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_feedback: feedback,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    await supabase.from('template_approval_history').insert({
      template_id: id,
      action: 'changes_requested',
      performed_by: user.id,
      feedback,
      previous_status: prevStatus,
      new_status: 'changes_requested',
    })

    setTemplates(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [templates])

  const fetchApprovalHistory = useCallback(async (templateId: string) => {
    const { data, error: fetchError } = await supabase
      .from('template_approval_history')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError
    return (data || []) as ApprovalHistoryEntry[]
  }, [])

  const cloneToAgent = useCallback(async (
    template: TeamTemplate,
    parameterValues?: Record<string, string | number | boolean>,
  ) => {
    const map = buildTemplatesMap(templates)
    const resolved = resolveInheritance(template, map)

    let systemPrompt = resolved.system_prompt
    if (parameterValues && systemPrompt) {
      systemPrompt = substituteVariables(systemPrompt, parameterValues)
    }

    const agentSettings: Record<string, unknown> = {
      ...(resolved.settings || {}),
    }
    agentSettings.template_id = template.id
    if (resolved.inheritanceChain.length > 1) {
      agentSettings.inheritance_chain = resolved.inheritanceChain
    }
    if (parameterValues && Object.keys(parameterValues).length > 0) {
      agentSettings.parameter_values = parameterValues
    }

    if (isDemo) {
      const newAgent = {
        id: `demo_agent_${Date.now()}`,
        user_id: 'demo',
        name: resolved.name,
        role: resolved.role,
        framework: resolved.framework,
        model: null,
        system_prompt: systemPrompt,
        settings: agentSettings,
        created_at: new Date().toISOString(),
      }
      addAgent(newAgent)
      return newAgent
    }

    const { data, error: insertError } = await supabase
      .from('agents')
      .insert({
        name: resolved.name,
        role: resolved.role,
        framework: resolved.framework,
        system_prompt: systemPrompt,
        settings: agentSettings,
      })
      .select()
      .single()

    if (insertError) throw insertError

    addAgent(data)
    return data
  }, [isDemo, addAgent, templates])

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

  const resolveTemplate = useCallback((template: TeamTemplate): ResolvedTemplate => {
    const map = buildTemplatesMap(templates)
    return resolveInheritance(template, map)
  }, [templates])

  const checkCircularRef = useCallback((templateId: string, parentId: string): boolean => {
    const map = buildTemplatesMap(templates)
    return wouldCreateCircularRef(templateId, parentId, map)
  }, [templates])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    fetchAllTemplates,
    fetchPendingReview,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    submitForReview,
    approveTemplate,
    rejectTemplate,
    requestChanges,
    fetchApprovalHistory,
    cloneToAgent,
    searchTemplates,
    getCategories,
    resolveTemplate,
    checkCircularRef,
  }
}
