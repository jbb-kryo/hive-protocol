'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { UnverifiedEmailBanner } from '@/components/dashboard/unverified-email-banner'
import { SessionExpirationWarning } from '@/components/dashboard/session-expiration-warning'
import { CommandPalette } from '@/components/dashboard/command-palette'
import { KeyboardShortcutsDialog } from '@/components/dashboard/keyboard-shortcuts-dialog'
import { GlobalSearchDialog } from '@/components/dashboard/global-search-dialog'
import { useAuth } from '@/hooks/use-auth'
import { useKeyboardShortcuts, useNavigationShortcuts } from '@/hooks/use-keyboard-shortcuts'

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { authChecked, emailVerified, isDemo, checkAuth } = useAuth()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)

  const navigationShortcuts = useNavigationShortcuts()

  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
      description: 'Open command palette',
      action: () => setCommandPaletteOpen(true),
    },
    {
      key: 'p',
      metaKey: true,
      ctrlKey: true,
      description: 'Global search',
      action: () => setGlobalSearchOpen(true),
    },
    {
      key: 'f',
      metaKey: true,
      ctrlKey: true,
      shiftKey: true,
      description: 'Global search',
      action: () => setGlobalSearchOpen(true),
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => setShortcutsDialogOpen(true),
    },
    ...navigationShortcuts,
  ])

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <KeyboardShortcutsDialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen} />
      <GlobalSearchDialog open={globalSearchOpen} onOpenChange={setGlobalSearchOpen} />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          {!isDemo && (
            <div className="p-4 md:p-6 space-y-4 lg:pt-4 pt-20">
              <SessionExpirationWarning onRefresh={checkAuth} />
              {!emailVerified && <UnverifiedEmailBanner />}
            </div>
          )}
          <div className="lg:pt-0 pt-16">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
