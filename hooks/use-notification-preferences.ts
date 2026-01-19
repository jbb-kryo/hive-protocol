'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'

export interface NotificationPreferences {
  email_notifications: boolean
  swarm_updates: boolean
  agent_alerts: boolean
  weekly_digest: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_notifications: true,
  swarm_updates: true,
  agent_alerts: true,
  weekly_digest: false,
}

export function useNotificationPreferences() {
  const { isDemo } = useStore()
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadPreferences = useCallback(async () => {
    if (isDemo) {
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error

      if (data?.notification_preferences) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...data.notification_preferences,
        })
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err)
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  const updatePreference = useCallback(async <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ): Promise<boolean> => {
    if (isDemo) {
      setPreferences(prev => ({ ...prev, [key]: value }))
      return true
    }

    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: newPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      return true
    } catch (err) {
      console.error('Failed to save notification preference:', err)
      setPreferences(preferences)
      return false
    } finally {
      setSaving(false)
    }
  }, [isDemo, preferences])

  const updateAllPreferences = useCallback(async (
    newPreferences: NotificationPreferences
  ): Promise<boolean> => {
    if (isDemo) {
      setPreferences(newPreferences)
      return true
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: newPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setPreferences(newPreferences)
      return true
    } catch (err) {
      console.error('Failed to save notification preferences:', err)
      return false
    } finally {
      setSaving(false)
    }
  }, [isDemo])

  return {
    preferences,
    loading,
    saving,
    updatePreference,
    updateAllPreferences,
    reload: loadPreferences,
  }
}
