'use client'

import { useState, useEffect, useCallback } from 'react'

export interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export interface CookieConsent {
  given: boolean
  timestamp: string | null
  preferences: CookiePreferences
}

const CONSENT_KEY = 'hive-cookie-consent'
const CONSENT_COOKIE = 'hive_cookie_consent'

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false,
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length))
  }
  return null
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    const cookieValue = getCookie(CONSENT_COOKIE)

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookieConsent
        setConsent(parsed)
        setShowBanner(false)
      } catch {
        setShowBanner(true)
      }
    } else if (cookieValue) {
      try {
        const parsed = JSON.parse(cookieValue) as CookieConsent
        setConsent(parsed)
        localStorage.setItem(CONSENT_KEY, cookieValue)
        setShowBanner(false)
      } catch {
        setShowBanner(true)
      }
    } else {
      setShowBanner(true)
    }

    setIsLoaded(true)
  }, [])

  const saveConsent = useCallback((preferences: CookiePreferences) => {
    const newConsent: CookieConsent = {
      given: true,
      timestamp: new Date().toISOString(),
      preferences: {
        ...preferences,
        essential: true,
      },
    }

    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent))
    setCookie(CONSENT_COOKIE, JSON.stringify(newConsent), 365)
    setConsent(newConsent)
    setShowBanner(false)
    setShowCustomize(false)
  }, [])

  const acceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    })
  }, [saveConsent])

  const rejectNonEssential = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    })
  }, [saveConsent])

  const saveCustomPreferences = useCallback((preferences: Partial<CookiePreferences>) => {
    saveConsent({
      ...DEFAULT_PREFERENCES,
      ...preferences,
      essential: true,
    })
  }, [saveConsent])

  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY)
    document.cookie = `${CONSENT_COOKIE}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    setConsent(null)
    setShowBanner(true)
  }, [])

  const openPreferences = useCallback(() => {
    setShowBanner(true)
    setShowCustomize(true)
  }, [])

  const hasConsent = useCallback((category: keyof CookiePreferences): boolean => {
    if (!consent?.given) return category === 'essential'
    return consent.preferences[category] ?? false
  }, [consent])

  return {
    consent,
    showBanner,
    showCustomize,
    isLoaded,
    setShowBanner,
    setShowCustomize,
    acceptAll,
    rejectNonEssential,
    saveCustomPreferences,
    resetConsent,
    openPreferences,
    hasConsent,
  }
}
