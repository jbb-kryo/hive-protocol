import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserIntegration {
  id: string
  user_id: string
  integration_type: string
  name: string
  masked_credentials: Record<string, string>
  is_connected: boolean
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface IntegrationConfig {
  type: string
  name: string
  description: string
  icon: string
  category: string
  fields: IntegrationField[]
}

export interface IntegrationField {
  key: string
  label: string
  type: 'text' | 'password' | 'url'
  placeholder?: string
  required?: boolean
  helpText?: string
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  }
}

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

async function storeCredentialsSecurely(
  integrationId: string,
  credentials: Record<string, string>
): Promise<Record<string, string>> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${getSupabaseUrl()}/functions/v1/secure-credentials/store`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integration_id: integrationId,
        credentials,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to store credentials')
  }

  const data = await response.json()
  return data.masked_credentials
}

async function fetchMaskedCredentials(
  integrationId: string
): Promise<Record<string, string>> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${getSupabaseUrl()}/functions/v1/secure-credentials/masked?integration_id=${integrationId}`,
    {
      method: 'GET',
      headers,
    }
  )

  if (!response.ok) {
    return {}
  }

  const data = await response.json()
  return data.credentials || {}
}

async function deleteCredentialsSecurely(integrationId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${getSupabaseUrl()}/functions/v1/secure-credentials/delete?integration_id=${integrationId}`,
    {
      method: 'DELETE',
      headers,
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete credentials')
  }
}

export async function proxyApiCall(
  integrationId: string,
  credentialKey: string,
  targetUrl: string,
  options?: {
    method?: string
    headers?: Record<string, string>
    body?: unknown
  }
): Promise<{ status: number; data: unknown }> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${getSupabaseUrl()}/functions/v1/secure-credentials/proxy`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integration_id: integrationId,
        credential_key: credentialKey,
        target_url: targetUrl,
        method: options?.method,
        headers: options?.headers,
        body: options?.body,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to make API call')
  }

  return response.json()
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<UserIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIntegrations([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const integrationsWithMasked = await Promise.all(
        (data || []).map(async (integration) => {
          const masked = await fetchMaskedCredentials(integration.id)
          return {
            ...integration,
            masked_credentials: masked,
          }
        })
      )

      setIntegrations(integrationsWithMasked)
    } catch (err) {
      console.error('Error fetching integrations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  const saveIntegration = async (
    integrationType: string,
    name: string,
    credentials: Record<string, string>
  ): Promise<UserIntegration | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const existing = integrations.find((i) => i.integration_type === integrationType)

      if (existing) {
        const { data, error: updateError } = await supabase
          .from('user_integrations')
          .update({
            name,
            is_connected: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) throw updateError

        const maskedCredentials = await storeCredentialsSecurely(data.id, credentials)

        const updated = {
          ...data,
          masked_credentials: maskedCredentials,
        }

        setIntegrations((prev) =>
          prev.map((i) => (i.id === existing.id ? updated : i))
        )

        return updated
      } else {
        const { data, error: insertError } = await supabase
          .from('user_integrations')
          .insert({
            user_id: user.id,
            integration_type: integrationType,
            name,
            credentials: {},
            is_connected: true,
          })
          .select()
          .single()

        if (insertError) throw insertError

        const maskedCredentials = await storeCredentialsSecurely(data.id, credentials)

        const newIntegration = {
          ...data,
          masked_credentials: maskedCredentials,
        }

        setIntegrations((prev) => [newIntegration, ...prev])
        return newIntegration
      }
    } catch (err) {
      console.error('Error saving integration:', err)
      throw err
    }
  }

  const updateIntegration = async (
    id: string,
    updates: Partial<Pick<UserIntegration, 'name' | 'is_connected'>> & {
      credentials?: Record<string, string>
    }
  ): Promise<UserIntegration | null> => {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (updates.name !== undefined) {
        updateData.name = updates.name
      }
      if (updates.is_connected !== undefined) {
        updateData.is_connected = updates.is_connected
      }

      const { data, error: updateError } = await supabase
        .from('user_integrations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      let maskedCredentials = integrations.find((i) => i.id === id)?.masked_credentials || {}

      if (updates.credentials) {
        maskedCredentials = await storeCredentialsSecurely(id, updates.credentials)
      }

      const updated = {
        ...data,
        masked_credentials: maskedCredentials,
      }

      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? updated : i))
      )

      return updated
    } catch (err) {
      console.error('Error updating integration:', err)
      throw err
    }
  }

  const disconnectIntegration = async (id: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('user_integrations')
        .update({ is_connected: false })
        .eq('id', id)

      if (updateError) throw updateError

      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_connected: false } : i))
      )
    } catch (err) {
      console.error('Error disconnecting integration:', err)
      throw err
    }
  }

  const reconnectIntegration = async (id: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('user_integrations')
        .update({
          is_connected: true,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_connected: true } : i))
      )
    } catch (err) {
      console.error('Error reconnecting integration:', err)
      throw err
    }
  }

  const deleteIntegration = async (id: string): Promise<void> => {
    try {
      await deleteCredentialsSecurely(id)

      const { error: deleteError } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setIntegrations((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.error('Error deleting integration:', err)
      throw err
    }
  }

  const getIntegration = (integrationType: string): UserIntegration | undefined => {
    return integrations.find((i) => i.integration_type === integrationType)
  }

  const isConnected = (integrationType: string): boolean => {
    const integration = getIntegration(integrationType)
    return integration?.is_connected ?? false
  }

  const getMaskedCredentials = (integrationType: string): Record<string, string> => {
    const integration = getIntegration(integrationType)
    return integration?.masked_credentials || {}
  }

  return {
    integrations,
    loading,
    error,
    fetchIntegrations,
    saveIntegration,
    updateIntegration,
    disconnectIntegration,
    reconnectIntegration,
    deleteIntegration,
    getIntegration,
    isConnected,
    getMaskedCredentials,
    proxyApiCall,
  }
}
