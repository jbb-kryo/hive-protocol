'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { useDemo } from '@/hooks/use-demo'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { CURRENT_TOS_VERSION, CURRENT_PRIVACY_VERSION } from '@/lib/auth'

export function useAuth() {
  const router = useRouter()
  const { setUser, setIsDemo, user, isDemo } = useStore()
  const { initializeDemo } = useDemo()
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [tosNeedsAcceptance, setTosNeedsAcceptance] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setEmailVerified(!!session.user.email_confirmed_at)

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profile) {
          setUser(profile)
          setIsDemo(false)

          const needsTosAcceptance = !profile.tos_version ||
            profile.tos_version !== CURRENT_TOS_VERSION ||
            profile.privacy_version !== CURRENT_PRIVACY_VERSION
          setTosNeedsAcceptance(needsTosAcceptance)
        } else {
          setIsDemo(true)
          initializeDemo()
          setTosNeedsAcceptance(false)
        }
      } else {
        setIsDemo(true)
        initializeDemo()
        setTosNeedsAcceptance(false)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsDemo(true)
      initializeDemo()
      setTosNeedsAcceptance(false)
    } finally {
      setAuthChecked(true)
      setIsLoading(false)
    }
  }, [setUser, setIsDemo, initializeDemo])

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      ;(async () => {
        if (event === 'TOKEN_REFRESHED') {
          setSessionExpired(false)
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsDemo(true)
          initializeDemo()

          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            const rememberMe = localStorage.getItem('hive-remember-me')
            if (!rememberMe) {
              toast.error('Your session has expired. Please sign in again.')
              router.push('/login')
            }
          }
        }

        if (session) {
          setEmailVerified(!!session.user.email_confirmed_at)

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()

          if (profile) {
            setUser(profile)
            setIsDemo(false)
          }

          const expiresAt = session.expires_at
          if (expiresAt) {
            const now = Math.floor(Date.now() / 1000)
            const timeUntilExpiry = expiresAt - now

            if (timeUntilExpiry <= 0) {
              setSessionExpired(true)
            }
          }
        } else if (event !== 'SIGNED_OUT') {
          setUser(null)
          setIsDemo(true)
          initializeDemo()
        }
      })()
    })

    return () => subscription.unsubscribe()
  }, [checkAuth, setUser, setIsDemo, initializeDemo, router])

  const handleTosAccepted = useCallback(() => {
    setTosNeedsAcceptance(false)
    checkAuth()
  }, [checkAuth])

  return {
    user,
    isDemo,
    authChecked,
    isLoading,
    emailVerified,
    sessionExpired,
    tosNeedsAcceptance,
    checkAuth,
    handleTosAccepted,
  }
}
