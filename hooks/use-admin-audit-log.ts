import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface AuditLogEntry {
  id: string
  admin_user_id: string
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  admin_profile?: {
    full_name: string | null
    avatar_url: string | null
  }
}

export interface AuditLogFilters {
  action?: string
  target_type?: string
  admin_user_id?: string
  startDate?: string
  endDate?: string
}

export interface AuditLogPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ACTION_LABELS: Record<string, string> = {
  'user.update': 'User Updated',
  'user.suspend': 'User Suspended',
  'user.unsuspend': 'User Unsuspended',
  'user.delete': 'User Deleted',
  'user.role_change': 'Role Changed',
  'user.plan_change': 'Plan Changed',
  'config.update': 'Config Updated',
  'agent.delete': 'Agent Deleted',
  'swarm.delete': 'Swarm Deleted',
  'rate_limit.update': 'Rate Limit Updated',
  'model.update': 'AI Model Updated',
}

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getActionColor(action: string): string {
  if (action.includes('delete')) return 'text-red-600 bg-red-100 dark:bg-red-900/30'
  if (action.includes('suspend')) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
  if (action.includes('unsuspend')) return 'text-green-600 bg-green-100 dark:bg-green-900/30'
  if (action.includes('role')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
  if (action.includes('plan')) return 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30'
  return 'text-slate-600 bg-slate-100 dark:bg-slate-800'
}

export function useAdminAuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [pagination, setPagination] = useState<AuditLogPagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAuditLog = useCallback(async (
    page: number = 1,
    filters: AuditLogFilters = {}
  ) => {
    try {
      setLoading(true)
      setError(null)

      const offset = (page - 1) * pagination.limit

      let query = supabase
        .from('admin_audit_log')
        .select(`
          *,
          admin_profile:profiles!admin_user_id(full_name, avatar_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pagination.limit - 1)

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.target_type) {
        query = query.eq('target_type', filters.target_type)
      }

      if (filters.admin_user_id) {
        query = query.eq('admin_user_id', filters.admin_user_id)
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      setEntries(data || [])
      setPagination({
        page,
        limit: pagination.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pagination.limit),
      })

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit log'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  const getUniqueActions = useCallback(async (): Promise<string[]> => {
    const { data } = await supabase
      .from('admin_audit_log')
      .select('action')
      .limit(1000)

    const actionSet = new Set<string>()
    data?.forEach((d) => actionSet.add(d.action))
    return Array.from(actionSet).sort()
  }, [])

  const getUniqueAdmins = useCallback(async (): Promise<Array<{ id: string; name: string }>> => {
    const { data } = await supabase
      .from('admin_audit_log')
      .select('admin_user_id, admin_profile:profiles!admin_user_id(full_name)')
      .limit(1000)

    const adminMap = new Map<string, string>()
    data?.forEach((d) => {
      if (!adminMap.has(d.admin_user_id)) {
        const profile = d.admin_profile as unknown as { full_name: string | null } | null
        adminMap.set(d.admin_user_id, profile?.full_name || 'Unknown Admin')
      }
    })

    return Array.from(adminMap.entries()).map(([id, name]) => ({ id, name }))
  }, [])

  return {
    entries,
    pagination,
    loading,
    error,
    fetchAuditLog,
    getUniqueActions,
    getUniqueAdmins,
  }
}
