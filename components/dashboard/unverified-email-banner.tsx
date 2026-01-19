'use client'

import { useState } from 'react'
import { AlertCircle, Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resendVerificationEmail } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function UnverifiedEmailBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [isResending, setIsResending] = useState(false)

  if (dismissed) return null

  const handleResend = async () => {
    setIsResending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) {
        toast.error('No email found')
        return
      }

      await resendVerificationEmail(session.user.email)
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to send verification email')
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Alert className="relative border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <span className="text-yellow-800 dark:text-yellow-200">
            Your email address is not verified. Please check your inbox for the verification link.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isResending}
            className="whitespace-nowrap"
          >
            <Mail className="h-3 w-3 mr-1" />
            {isResending ? 'Sending...' : 'Resend email'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
