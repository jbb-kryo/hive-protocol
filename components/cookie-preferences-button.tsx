'use client'

import { Cookie } from 'lucide-react'
import { useCookieConsent } from '@/hooks/use-cookie-consent'

export function CookiePreferencesButton() {
  const { openPreferences } = useCookieConsent()

  return (
    <button
      onClick={openPreferences}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
    >
      <Cookie className="h-3.5 w-3.5" />
      Cookie Preferences
    </button>
  )
}
