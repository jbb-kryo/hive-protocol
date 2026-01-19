import { useState, useCallback } from 'react'
import { supabase, type Profile } from '@/lib/supabase'
import { useStore } from '@/store'

export interface ProfileUpdateData {
  full_name?: string | null
}

export interface EmailChangeResult {
  success: boolean
  message: string
  requiresVerification?: boolean
}

export function useProfile() {
  const { user, setUser } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setError('Not authenticated')
        return null
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (data) {
        setUser(data)
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [setUser])

  const updateProfile = useCallback(async (updates: ProfileUpdateData): Promise<Profile | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        throw new Error('Not authenticated')
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authUser.id)
        .select()
        .maybeSingle()

      if (updateError) throw updateError

      if (data) {
        setUser(data)
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setUser])

  const changeEmail = useCallback(async (newEmail: string): Promise<EmailChangeResult> => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        throw new Error('Not authenticated')
      }

      if (newEmail === authUser.email) {
        return {
          success: true,
          message: 'Email is unchanged',
          requiresVerification: false,
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      })

      if (updateError) {
        if (updateError.message.includes('already registered')) {
          throw new Error('This email is already registered to another account')
        }
        throw updateError
      }

      return {
        success: true,
        message: 'A confirmation email has been sent to your new address. Please verify to complete the change.',
        requiresVerification: true,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change email'
      setError(message)
      return {
        success: false,
        message,
        requiresVerification: false,
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const getCurrentEmail = useCallback(async (): Promise<string | null> => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    return authUser?.email || null
  }, [])

  const uploadAvatar = useCallback(async (blob: Blob): Promise<string | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        throw new Error('Not authenticated')
      }

      const fileName = `${authUser.id}/avatar.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', authUser.id)
        .select()
        .maybeSingle()

      if (updateError) throw updateError

      if (profileData) {
        setUser(profileData)
      }

      return avatarUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setUser])

  const deleteAvatar = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        throw new Error('Not authenticated')
      }

      const fileName = `${authUser.id}/avatar.jpg`

      await supabase.storage.from('avatars').remove([fileName])

      const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', authUser.id)
        .select()
        .maybeSingle()

      if (updateError) throw updateError

      if (profileData) {
        setUser(profileData)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete avatar'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setUser])

  return {
    profile: user,
    loading,
    error,
    fetchProfile,
    updateProfile,
    changeEmail,
    getCurrentEmail,
    uploadAvatar,
    deleteAvatar,
  }
}
