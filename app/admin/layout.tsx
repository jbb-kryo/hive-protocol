'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/sidebar'
import { UnverifiedEmailBanner } from '@/components/dashboard/unverified-email-banner'
import { SessionExpirationWarning } from '@/components/dashboard/session-expiration-warning'
import { useStore } from '@/store'
import { supabase } from '@/lib/supabase'
import { Shield, BarChart3, Users, Brain, Bot, Hexagon, TrendingUp, AlertCircle, ShieldCheck, Clock, KeyRound, History, MessageSquarePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const ADMIN_SESSION_TIMEOUT_MINUTES = 30

const adminNavItems = [
  { href: '/admin', icon: BarChart3, label: 'Overview', exact: true },
  { href: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/ai', icon: Brain, label: 'AI & Models' },
  { href: '/admin/agents', icon: Bot, label: 'All Agents' },
  { href: '/admin/swarms', icon: Hexagon, label: 'All Swarms' },
  { href: '/admin/feedback', icon: MessageSquarePlus, label: 'Feedback' },
  { href: '/admin/rate-limits', icon: Clock, label: 'Rate Limits' },
  { href: '/admin/security', icon: ShieldCheck, label: 'Security' },
  { href: '/admin/activity', icon: History, label: 'Activity Log' },
  { href: '/admin/errors', icon: AlertCircle, label: 'Error Logs' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { setUser, user } = useStore()
  const [emailVerified, setEmailVerified] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false)
  const sessionStartRef = useRef<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setEmailVerified(!!session.user.email_confirmed_at)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profile) {
        setUser(profile)
        if (profile.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        if (!profile.totp_enabled) {
          setRequires2FA(true)
          setIsAuthorized(false)
          return
        }

        sessionStartRef.current = new Date()
        setIsAuthorized(true)
        setRequires2FA(false)

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        const warningTime = (ADMIN_SESSION_TIMEOUT_MINUTES - 5) * 60 * 1000
        timeoutRef.current = setTimeout(() => {
          setSessionTimeoutWarning(true)
        }, warningTime)
      } else {
        router.push('/dashboard')
      }
    } finally {
      setIsLoading(false)
    }
  }, [router, setUser])

  useEffect(() => {
    checkAuth()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [checkAuth])

  const handleExtendSession = useCallback(async () => {
    setSessionTimeoutWarning(false)
    sessionStartRef.current = new Date()

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const warningTime = (ADMIN_SESSION_TIMEOUT_MINUTES - 5) * 60 * 1000
    timeoutRef.current = setTimeout(() => {
      setSessionTimeoutWarning(true)
    }, warningTime)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Shield className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (requires2FA) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <KeyRound className="h-10 w-10 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Two-Factor Authentication Required</h1>
            <p className="text-muted-foreground">
              Admin accounts must have two-factor authentication enabled for enhanced security.
              Please enable 2FA in your account settings to access the admin panel.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push('/settings?tab=security')} size="lg">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Enable Two-Factor Authentication
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 md:p-6 space-y-4">
          <SessionExpirationWarning onRefresh={checkAuth} />
          {sessionTimeoutWarning && (
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <Clock className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600 dark:text-amber-400">Admin Session Expiring Soon</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>Your admin session will expire in 5 minutes for security.</span>
                <Button size="sm" variant="outline" onClick={handleExtendSession}>
                  Extend Session
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {!emailVerified && <UnverifiedEmailBanner />}
        </div>
        <div className="border-b border-border bg-card/50 sticky top-0 z-10">
          <div className="px-4 lg:px-8">
            <nav className="flex gap-1 overflow-x-auto py-2">
              {adminNavItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
