import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface AIModel {
  id: string
  name: string
  provider: string
  model_id: string
  description: string | null
  capabilities: string[]
  context_window: number
  max_output_tokens: number
  input_cost_per_1k: number
  output_cost_per_1k: number
  is_active: boolean
  is_default: boolean
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ModelApiKey {
  id: string
  provider: string
  key_name: string
  is_active: boolean
  usage_count: number
  last_used_at: string | null
  created_at: string
}

export interface PlanRateLimit {
  id: string
  plan: string
  model_id: string | null
  requests_per_minute: number
  requests_per_day: number
  tokens_per_day: number
  max_agents: number
  max_swarms: number
  ai_models?: { name: string; provider: string } | null
  created_at: string
  updated_at: string
}

export interface DefaultAgent {
  id: string
  name: string
  role: string | null
  framework: string
  model_id: string | null
  system_prompt: string | null
  settings: Record<string, unknown>
  is_active: boolean
  sort_order: number
  ai_models?: { name: string; provider: string } | null
  created_at: string
  updated_at: string
}

export interface AdminAgent {
  id: string
  user_id: string
  name: string
  role: string | null
  framework: string
  model: string | null
  system_prompt: string | null
  settings: Record<string, unknown>
  created_at: string
  owner_email: string | null
  owner_name: string | null
}

export interface AdminSwarm {
  id: string
  user_id: string
  name: string
  task: string | null
  status: string
  visibility: string
  settings: Record<string, unknown>
  created_at: string
  owner_email: string | null
  owner_name: string | null
  agent_count: number
  message_count: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AIStats {
  total_models: number
  total_agents: number
  total_swarms: number
  total_default_agents: number
}

async function fetchAPI(resource: string, action: string, params?: Record<string, string>, body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const searchParams = new URLSearchParams({ resource, action, ...params })
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-ai?${searchParams}`

  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Request failed')
  }

  return response.json()
}

export function useAdminAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getStats = useCallback(async (): Promise<AIStats> => {
    return fetchAPI('stats', 'get')
  }, [])

  const listModels = useCallback(async (): Promise<AIModel[]> => {
    return fetchAPI('models', 'list')
  }, [])

  const createModel = useCallback(async (model: Partial<AIModel>): Promise<AIModel> => {
    return fetchAPI('models', 'create', undefined, model)
  }, [])

  const updateModel = useCallback(async (id: string, updates: Partial<AIModel>): Promise<AIModel> => {
    return fetchAPI('models', 'update', { id }, updates)
  }, [])

  const deleteModel = useCallback(async (id: string): Promise<void> => {
    await fetchAPI('models', 'delete', { id })
  }, [])

  const listApiKeys = useCallback(async (): Promise<ModelApiKey[]> => {
    return fetchAPI('api-keys', 'list')
  }, [])

  const createApiKey = useCallback(async (keyData: { provider: string; key_name: string; encrypted_key: string }): Promise<ModelApiKey> => {
    return fetchAPI('api-keys', 'create', undefined, keyData)
  }, [])

  const updateApiKey = useCallback(async (id: string, updates: Partial<ModelApiKey>): Promise<ModelApiKey> => {
    return fetchAPI('api-keys', 'update', { id }, updates)
  }, [])

  const deleteApiKey = useCallback(async (id: string): Promise<void> => {
    await fetchAPI('api-keys', 'delete', { id })
  }, [])

  const listRateLimits = useCallback(async (): Promise<PlanRateLimit[]> => {
    return fetchAPI('rate-limits', 'list')
  }, [])

  const upsertRateLimit = useCallback(async (limitData: Partial<PlanRateLimit>): Promise<PlanRateLimit> => {
    return fetchAPI('rate-limits', 'upsert', undefined, limitData)
  }, [])

  const listDefaultAgents = useCallback(async (): Promise<DefaultAgent[]> => {
    return fetchAPI('default-agents', 'list')
  }, [])

  const createDefaultAgent = useCallback(async (agent: Partial<DefaultAgent>): Promise<DefaultAgent> => {
    return fetchAPI('default-agents', 'create', undefined, agent)
  }, [])

  const updateDefaultAgent = useCallback(async (id: string, updates: Partial<DefaultAgent>): Promise<DefaultAgent> => {
    return fetchAPI('default-agents', 'update', { id }, updates)
  }, [])

  const deleteDefaultAgent = useCallback(async (id: string): Promise<void> => {
    await fetchAPI('default-agents', 'delete', { id })
  }, [])

  const listAllAgents = useCallback(async (params: {
    page?: number
    limit?: number
    search?: string
    userId?: string
  }): Promise<{ agents: AdminAgent[]; pagination: Pagination }> => {
    const queryParams: Record<string, string> = {}
    if (params.page) queryParams.page = params.page.toString()
    if (params.limit) queryParams.limit = params.limit.toString()
    if (params.search) queryParams.search = params.search
    if (params.userId) queryParams.userId = params.userId
    return fetchAPI('agents', 'list', queryParams)
  }, [])

  const updateAgent = useCallback(async (id: string, updates: Partial<AdminAgent>): Promise<AdminAgent> => {
    return fetchAPI('agents', 'update', { id }, updates)
  }, [])

  const deleteAgent = useCallback(async (id: string): Promise<void> => {
    await fetchAPI('agents', 'delete', { id })
  }, [])

  const duplicateAgent = useCallback(async (id: string, newOwnerId?: string): Promise<AdminAgent> => {
    return fetchAPI('agents', 'duplicate', { id }, { newOwnerId })
  }, [])

  const transferAgent = useCallback(async (id: string, newOwnerId: string): Promise<AdminAgent> => {
    return fetchAPI('agents', 'transfer', { id }, { newOwnerId })
  }, [])

  const listAllSwarms = useCallback(async (params: {
    page?: number
    limit?: number
    search?: string
    userId?: string
    status?: string
  }): Promise<{ swarms: AdminSwarm[]; pagination: Pagination }> => {
    const queryParams: Record<string, string> = {}
    if (params.page) queryParams.page = params.page.toString()
    if (params.limit) queryParams.limit = params.limit.toString()
    if (params.search) queryParams.search = params.search
    if (params.userId) queryParams.userId = params.userId
    if (params.status) queryParams.status = params.status
    return fetchAPI('swarms', 'list', queryParams)
  }, [])

  const updateSwarm = useCallback(async (id: string, updates: Partial<AdminSwarm>): Promise<AdminSwarm> => {
    return fetchAPI('swarms', 'update', { id }, updates)
  }, [])

  const deleteSwarm = useCallback(async (id: string): Promise<void> => {
    await fetchAPI('swarms', 'delete', { id })
  }, [])

  const duplicateSwarm = useCallback(async (id: string, newOwnerId?: string): Promise<AdminSwarm> => {
    return fetchAPI('swarms', 'duplicate', { id }, { newOwnerId })
  }, [])

  const transferSwarm = useCallback(async (id: string, newOwnerId: string): Promise<AdminSwarm> => {
    return fetchAPI('swarms', 'transfer', { id }, { newOwnerId })
  }, [])

  return {
    loading,
    error,
    getStats,
    listModels,
    createModel,
    updateModel,
    deleteModel,
    listApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    listRateLimits,
    upsertRateLimit,
    listDefaultAgents,
    createDefaultAgent,
    updateDefaultAgent,
    deleteDefaultAgent,
    listAllAgents,
    updateAgent,
    deleteAgent,
    duplicateAgent,
    transferAgent,
    listAllSwarms,
    updateSwarm,
    deleteSwarm,
    duplicateSwarm,
    transferSwarm,
  }
}
