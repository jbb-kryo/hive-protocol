'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface SessionExpirationWarningProps {
  onRefresh?: () => void
}

export function SessionExpirationWarning({ onRefresh }: SessionExpirationWarningProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    let warningTimer: NodeJS.Timeout
    let countdownTimer: NodeJS.Timeout

    const checkSessionExpiry = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setShowWarning(false)
        return
      }

      const expiresAt = session.expires_at
      if (!expiresAt) return

      const now = Math.floor(Date.now() / 1000)
      const timeUntilExpiry = expiresAt - now
      const warningThreshold = 5 * 60

      if (timeUntilExpiry <= warningThreshold && timeUntilExpiry > 0) {
        setShowWarning(true)
        setTimeRemaining(timeUntilExpiry)

        countdownTimer = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(countdownTimer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setShowWarning(false)
      }
    }

    checkSessionExpiry()
    warningTimer = setInterval(checkSessionExpiry, 30000)

    return () => {
      clearInterval(warningTimer)
      if (countdownTimer) clearInterval(countdownTimer)
    }
  }, [])

  const handleRefresh = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) throw error

      if (data.session) {
        setShowWarning(false)
        toast.success('Session refreshed successfully')
        onRefresh?.()
      }
    } catch (error) {
      toast.error('Failed to refresh session')
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (!showWarning) return null

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
      <AlertTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
        <Clock className="h-4 w-4" />
        Session Expiring Soon
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4 mt-2">
        <div className="flex-1">
          <span className="text-orange-800 dark:text-orange-200">
            Your session will expire in {formatTime(timeRemaining)}. Please refresh to continue.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="whitespace-nowrap"
        >
          Refresh Session
        </Button>
      </AlertDescription>
    </Alert>
  )
}
