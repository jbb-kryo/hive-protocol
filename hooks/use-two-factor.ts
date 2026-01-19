'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface TwoFactorSetupData {
  secret: string
  otpauthUrl: string
  backupCodes: string[]
}

interface TwoFactorStatus {
  enabled: boolean
  verifiedAt: string | null
}

export function useTwoFactor() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }, [])

  const getFunctionUrl = useCallback((action: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    return `${supabaseUrl}/functions/v1/two-factor-auth/${action}`
  }, [])

  const setup = useCallback(async (): Promise<TwoFactorSetupData | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(getFunctionUrl('setup'), {
        method: 'POST',
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup 2FA')
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to setup 2FA'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders, getFunctionUrl])

  const verify = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(getFunctionUrl('verify'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code')
      }

      return data.valid === true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify code'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders, getFunctionUrl])

  const validate = useCallback(async (code: string, userId?: string): Promise<{ valid: boolean; usedBackupCode?: boolean; remainingBackupCodes?: number }> => {
    setIsLoading(true)
    setError(null)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(getFunctionUrl('validate'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { valid: false }
      }

      return {
        valid: data.valid === true,
        usedBackupCode: data.usedBackupCode,
        remainingBackupCodes: data.remainingBackupCodes,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate code'
      setError(message)
      return { valid: false }
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders, getFunctionUrl])

  const disable = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(getFunctionUrl('disable'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA')
      }

      return data.disabled === true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable 2FA'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders, getFunctionUrl])

  const regenerateBackupCodes = useCallback(async (code: string): Promise<string[] | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(getFunctionUrl('regenerate-backup'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate backup codes')
      }

      return data.backupCodes
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate backup codes'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders, getFunctionUrl])

  const getStatus = useCallback(async (): Promise<TwoFactorStatus | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(getFunctionUrl('status'), {
        method: 'GET',
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get 2FA status')
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get 2FA status'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders, getFunctionUrl])

  return {
    setup,
    verify,
    validate,
    disable,
    regenerateBackupCodes,
    getStatus,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}
