'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface PlanRateLimit {
  id: string
  plan: string
  model_id: string | null
  requests_per_minute: number
  requests_per_day: number
  tokens_per_day: number
  max_agents: number
  max_swarms: number
  messages_per_day: number
  messages_per_minute: number
  agents_per_day: number
  swarms_per_day: number
  created_at: string
  updated_at: string
}

export interface RateLimitAuditLog {
  id: string
  admin_id: string | null
  action: 'create' | 'update' | 'delete'
  plan: string
  rate_limit_id: string | null
  previous_values: Record<string, unknown>
  new_values: Record<string, unknown>
  notes: string | null
  created_at: string
  admin?: {
    full_name: string | null
  }
}

export interface CreateRateLimitData {
  plan: string
  model_id?: string | null
  requests_per_minute: number
  requests_per_day: number
  tokens_per_day: number
  max_agents: number
  max_swarms: number
  messages_per_day: number
  messages_per_minute: number
  agents_per_day: number
  swarms_per_day: number
}

export interface UpdateRateLimitData {
  requests_per_minute?: number
  requests_per_day?: number
  tokens_per_day?: number
  max_agents?: number
  max_swarms?: number
  messages_per_day?: number
  messages_per_minute?: number
  agents_per_day?: number
  swarms_per_day?: number
}

export function useAdminRateLimits() {
  const [rateLimits, setRateLimits] = useState<PlanRateLimit[]>([])
  const [auditLogs, setAuditLogs] = useState<RateLimitAuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRateLimits = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('plan_rate_limits')
        .select('*')
        .order('plan', { ascending: true })

      if (fetchError) throw fetchError

      setRateLimits(data || [])
      return data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rate limits'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAuditLogs = useCallback(async (limit = 50) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('rate_limit_audit_log')
        .select(`
          *,
          admin:profiles!rate_limit_audit_log_admin_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError

      setAuditLogs(data || [])
      return data || []
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
      return []
    }
  }, [])

  const logAuditAction = useCallback(async (
    action: 'create' | 'update' | 'delete',
    plan: string,
    rateLimitId: string | null,
    previousValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
    notes?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('rate_limit_audit_log')
      .insert({
        admin_id: user.id,
        action,
        plan,
        rate_limit_id: rateLimitId,
        previous_values: previousValues,
        new_values: newValues,
        notes,
      })
  }, [])

  const createRateLimit = useCallback(async (data: CreateRateLimitData) => {
    setLoading(true)
    setError(null)

    try {
      const existing = rateLimits.find(r => r.plan === data.plan)
      if (existing) {
        throw new Error(`Rate limit for plan "${data.plan}" already exists`)
      }

      const { data: newLimit, error: insertError } = await supabase
        .from('plan_rate_limits')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) throw insertError

      await logAuditAction('create', data.plan, newLimit.id, {}, data as unknown as Record<string, unknown>)

      setRateLimits(prev => [...prev, newLimit].sort((a, b) => a.plan.localeCompare(b.plan)))
      return newLimit
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create rate limit'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [rateLimits, logAuditAction])

  const updateRateLimit = useCallback(async (
    id: string,
    updates: UpdateRateLimitData,
    notes?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const existing = rateLimits.find(r => r.id === id)
      if (!existing) {
        throw new Error('Rate limit not found')
      }

      const previousValues: Record<string, unknown> = {}
      const newValues: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          previousValues[key] = existing[key as keyof PlanRateLimit]
          newValues[key] = value
        }
      }

      const { data: updatedLimit, error: updateError } = await supabase
        .from('plan_rate_limits')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await logAuditAction('update', existing.plan, id, previousValues, newValues, notes)

      setRateLimits(prev => prev.map(r => r.id === id ? updatedLimit : r))
      return updatedLimit
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update rate limit'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [rateLimits, logAuditAction])

  const deleteRateLimit = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const existing = rateLimits.find(r => r.id === id)
      if (!existing) {
        throw new Error('Rate limit not found')
      }

      if (['free', 'pro', 'enterprise'].includes(existing.plan)) {
        throw new Error('Cannot delete default plan rate limits')
      }

      const { error: deleteError } = await supabase
        .from('plan_rate_limits')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await logAuditAction('delete', existing.plan, id, existing as unknown as Record<string, unknown>, {})

      setRateLimits(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete rate limit'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [rateLimits, logAuditAction])

  const duplicateRateLimit = useCallback(async (id: string, newPlan: string) => {
    const existing = rateLimits.find(r => r.id === id)
    if (!existing) {
      throw new Error('Rate limit not found')
    }

    return createRateLimit({
      plan: newPlan,
      model_id: existing.model_id,
      requests_per_minute: existing.requests_per_minute,
      requests_per_day: existing.requests_per_day,
      tokens_per_day: existing.tokens_per_day,
      max_agents: existing.max_agents,
      max_swarms: existing.max_swarms,
      messages_per_day: existing.messages_per_day,
      messages_per_minute: existing.messages_per_minute,
      agents_per_day: existing.agents_per_day,
      swarms_per_day: existing.swarms_per_day,
    })
  }, [rateLimits, createRateLimit])

  const getRateLimitByPlan = useCallback((plan: string) => {
    return rateLimits.find(r => r.plan === plan)
  }, [rateLimits])

  const compareRateLimits = useCallback((planA: string, planB: string) => {
    const limitA = rateLimits.find(r => r.plan === planA)
    const limitB = rateLimits.find(r => r.plan === planB)

    if (!limitA || !limitB) return null

    const fields = [
      'requests_per_minute',
      'requests_per_day',
      'tokens_per_day',
      'max_agents',
      'max_swarms',
      'messages_per_day',
      'messages_per_minute',
      'agents_per_day',
      'swarms_per_day',
    ] as const

    const comparison: Record<string, { planA: number; planB: number; diff: number; diffPercent: number }> = {}

    for (const field of fields) {
      const valueA = limitA[field]
      const valueB = limitB[field]
      comparison[field] = {
        planA: valueA,
        planB: valueB,
        diff: valueB - valueA,
        diffPercent: valueA === 0 ? 100 : Math.round(((valueB - valueA) / valueA) * 100),
      }
    }

    return comparison
  }, [rateLimits])

  return {
    rateLimits,
    auditLogs,
    loading,
    error,
    fetchRateLimits,
    fetchAuditLogs,
    createRateLimit,
    updateRateLimit,
    deleteRateLimit,
    duplicateRateLimit,
    getRateLimitByPlan,
    compareRateLimits,
  }
}
