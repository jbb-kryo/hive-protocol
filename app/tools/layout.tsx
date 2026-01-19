'use client'

import { Sidebar } from '@/components/dashboard/sidebar'
import { UnverifiedEmailBanner } from '@/components/dashboard/unverified-email-banner'
import { SessionExpirationWarning } from '@/components/dashboard/session-expiration-warning'
import { useAuth } from '@/hooks/use-auth'

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { authChecked, emailVerified, isDemo, checkAuth } = useAuth()

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {!isDemo && (
          <div className="p-4 md:p-6 space-y-4">
            <SessionExpirationWarning onRefresh={checkAuth} />
            {!emailVerified && <UnverifiedEmailBanner />}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
