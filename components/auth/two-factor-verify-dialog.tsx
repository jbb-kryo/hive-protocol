'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Shield, KeyRound } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'

interface TwoFactorVerifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
  onCancel: () => void
}

export function TwoFactorVerifyDialog({
  open,
  onOpenChange,
  onVerified,
  onCancel,
}: TwoFactorVerifyDialogProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useBackupCode, setUseBackupCode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setCode('')
      setError(null)
      setUseBackupCode(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleVerify = async () => {
    if (!code.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/two-factor-auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.replace(/[\s-]/g, '') }),
      })

      const data = await response.json()

      if (!response.ok || !data.valid) {
        throw new Error(data.error || 'Invalid code')
      }

      if (data.usedBackupCode) {
        console.log(`Backup code used. ${data.remainingBackupCodes} codes remaining.`)
      }

      onVerified()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length >= 6) {
      handleVerify()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {useBackupCode
              ? 'Enter one of your backup codes to sign in.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="totp-code">
              {useBackupCode ? 'Backup Code' : 'Authentication Code'}
            </Label>
            <Input
              ref={inputRef}
              id="totp-code"
              placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
              value={code}
              onChange={(e) => {
                const value = useBackupCode
                  ? e.target.value.toUpperCase()
                  : e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(value)
              }}
              maxLength={useBackupCode ? 9 : 6}
              className="text-center text-lg tracking-widest font-mono"
              onKeyDown={handleKeyDown}
              autoComplete="one-time-code"
            />
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length < 6 || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Verify
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setUseBackupCode(!useBackupCode)
                setCode('')
                setError(null)
              }}
              className="text-muted-foreground"
            >
              <KeyRound className="h-4 w-4 mr-1" />
              {useBackupCode ? 'Use authenticator app' : 'Use backup code'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
