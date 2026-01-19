import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface AdminUser {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  plan: string
  role: string
  suspended: boolean
  suspended_at: string | null
  suspended_reason: string | null
  onboarding_complete: boolean
  totp_enabled: boolean
  created_at: string
  updated_at: string | null
  agent_count: number
  swarm_count: number
}

export interface UserDetails extends AdminUser {
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  tos_accepted_at: string | null
  tos_version: string | null
  privacy_accepted_at: string | null
  privacy_version: string | null
  agents: Array<{
    id: string
    name: string
    framework: string
    model: string | null
    created_at: string
  }>
  swarms: Array<{
    id: string
    name: string
    status: string
    created_at: string
  }>
  recent_activity: Array<{
    id: string
    activity_type: string
    title: string
    created_at: string
  }>
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UserListFilters {
  search?: string
  plan?: string
  role?: string
  suspended?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async (page: number = 1, filters: UserListFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const params = new URLSearchParams({
        action: 'list',
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filters.search) params.set('search', filters.search)
      if (filters.plan) params.set('plan', filters.plan)
      if (filters.role) params.set('role', filters.role)
      if (filters.suspended !== undefined) params.set('suspended', filters.suspended.toString())
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-users?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  const getUserDetails = useCallback(async (userId: string): Promise<UserDetails> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-users?action=details&userId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to fetch user details')
    }

    return response.json()
  }, [])

  const updateUser = useCallback(async (params: {
    userId: string
    plan?: string
    role?: string
    suspended?: boolean
    suspendedReason?: string
  }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-users?action=update`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to update user')
    }

    const updatedUser = await response.json()

    setUsers((prev) =>
      prev.map((u) => (u.id === params.userId ? { ...u, ...updatedUser } : u))
    )

    return updatedUser
  }, [])

  const deleteUser = useCallback(async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-users?action=delete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to delete user')
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setPagination((prev) => ({ ...prev, total: prev.total - 1 }))

    return true
  }, [])

  const getImpersonationLink = useCallback(async (userId: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-users?action=impersonate&userId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to generate impersonation link')
    }

    const data = await response.json()
    return data.action_link
  }, [])

  return {
    users,
    pagination,
    loading,
    error,
    fetchUsers,
    getUserDetails,
    updateUser,
    deleteUser,
    getImpersonationLink,
  }
}
