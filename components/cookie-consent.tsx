'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Settings, Shield, BarChart3, Megaphone, Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useCookieConsent, CookiePreferences } from '@/hooks/use-cookie-consent'

const cookieCategories = [
  {
    id: 'essential' as const,
    name: 'Essential',
    description: 'Required for the website to function. Cannot be disabled.',
    icon: Shield,
    required: true,
  },
  {
    id: 'analytics' as const,
    name: 'Analytics',
    description: 'Help us understand how visitors interact with our website.',
    icon: BarChart3,
    required: false,
  },
  {
    id: 'marketing' as const,
    name: 'Marketing',
    description: 'Used to deliver relevant advertisements and track campaigns.',
    icon: Megaphone,
    required: false,
  },
  {
    id: 'preferences' as const,
    name: 'Preferences',
    description: 'Remember your settings and personalization choices.',
    icon: Sliders,
    required: false,
  },
]

export function CookieConsent() {
  const {
    showBanner,
    showCustomize,
    isLoaded,
    setShowCustomize,
    acceptAll,
    rejectNonEssential,
    saveCustomPreferences,
  } = useCookieConsent()

  const [customPreferences, setCustomPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
  })

  if (!isLoaded || !showBanner) return null

  const handleToggle = (category: keyof CookiePreferences) => {
    if (category === 'essential') return
    setCustomPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const handleSaveCustom = () => {
    saveCustomPreferences(customPreferences)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="mx-auto max-w-4xl">
            <div className="rounded-xl border bg-background/95 backdrop-blur-lg shadow-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                {!showCustomize ? (
                  <motion.div
                    key="simple"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 md:p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Cookie className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1">Cookie Preferences</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.
                            By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                            <Link href="/privacy" className="text-primary hover:underline">
                              Privacy Policy
                            </Link>{' '}
                            for more information.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCustomize(true)}
                          className="gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Customize
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={rejectNonEssential}
                        >
                          Reject All
                        </Button>
                        <Button
                          size="sm"
                          onClick={acceptAll}
                        >
                          Accept All
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="customize"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 md:p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Cookie className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">Customize Cookie Preferences</h3>
                          <p className="text-sm text-muted-foreground">
                            Choose which cookies you want to allow
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCustomize(false)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-2">
                      {cookieCategories.map((category) => {
                        const Icon = category.icon
                        return (
                          <div
                            key={category.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                          >
                            <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-sm">{category.name}</span>
                                {category.required && (
                                  <span className="text-xs text-muted-foreground">(Required)</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {category.description}
                              </p>
                            </div>
                            <Switch
                              checked={category.required || customPreferences[category.id]}
                              onCheckedChange={() => handleToggle(category.id)}
                              disabled={category.required}
                              className="shrink-0"
                            />
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={rejectNonEssential}
                      >
                        Reject All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={acceptAll}
                      >
                        Accept All
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveCustom}
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
