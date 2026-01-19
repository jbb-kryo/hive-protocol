'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, ShieldCheck, ShieldOff, Key, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTwoFactor } from '@/hooks/use-two-factor'
import { useStore } from '@/store'
import { useToast } from '@/hooks/use-toast'
import { EnableTwoFactorDialog } from './enable-two-factor-dialog'
import { DisableTwoFactorDialog } from './disable-two-factor-dialog'
import { RegenerateBackupCodesDialog } from './regenerate-backup-codes-dialog'

export function TwoFactorSection() {
  const { isDemo, user, setUser } = useStore()
  const { getStatus, isLoading } = useTwoFactor()
  const { toast } = useToast()

  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null)
  const [showEnableDialog, setShowEnableDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  const checkStatus = useCallback(async () => {
    if (isDemo) {
      setCheckingStatus(false)
      return
    }

    const status = await getStatus()
    if (status) {
      setIs2FAEnabled(status.enabled)
      setVerifiedAt(status.verifiedAt)
    }
    setCheckingStatus(false)
  }, [isDemo, getStatus])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const handleEnabled = () => {
    setIs2FAEnabled(true)
    setVerifiedAt(new Date().toISOString())
    if (user) {
      setUser({ ...user, totp_enabled: true, totp_verified_at: new Date().toISOString() })
    }
  }

  const handleDisabled = () => {
    setIs2FAEnabled(false)
    setVerifiedAt(null)
    if (user) {
      setUser({ ...user, totp_enabled: false, totp_verified_at: null })
    }
  }

  const handleEnableClick = () => {
    if (isDemo) {
      toast({
        title: 'Demo Mode',
        description: 'Two-factor authentication is not available in demo mode.',
        variant: 'destructive',
      })
      return
    }
    setShowEnableDialog(true)
  }

  const handleDisableClick = () => {
    if (isDemo) {
      toast({
        title: 'Demo Mode',
        description: 'Two-factor authentication is not available in demo mode.',
        variant: 'destructive',
      })
      return
    }
    setShowDisableDialog(true)
  }

  const handleBackupCodesClick = () => {
    if (isDemo) {
      toast({
        title: 'Demo Mode',
        description: 'Two-factor authentication is not available in demo mode.',
        variant: 'destructive',
      })
      return
    }
    setShowBackupCodesDialog(true)
  }

  if (checkingStatus || isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking 2FA status...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {is2FAEnabled ? (
            <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5" />
          ) : (
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Two-Factor Authentication</h3>
              {is2FAEnabled ? (
                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {is2FAEnabled
                ? 'Your account is protected with two-factor authentication.'
                : 'Add an extra layer of security to your account.'}
            </p>
            {is2FAEnabled && verifiedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Enabled on {new Date(verifiedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {is2FAEnabled ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackupCodesClick}
            >
              <Key className="h-4 w-4 mr-2" />
              Regenerate Backup Codes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisableClick}
              className="text-destructive hover:text-destructive"
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              Disable 2FA
            </Button>
          </>
        ) : (
          <Button onClick={handleEnableClick}>
            <Shield className="h-4 w-4 mr-2" />
            Enable 2FA
          </Button>
        )}
      </div>

      <EnableTwoFactorDialog
        open={showEnableDialog}
        onOpenChange={setShowEnableDialog}
        onEnabled={handleEnabled}
      />

      <DisableTwoFactorDialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
        onDisabled={handleDisabled}
      />

      <RegenerateBackupCodesDialog
        open={showBackupCodesDialog}
        onOpenChange={setShowBackupCodesDialog}
      />
    </div>
  )
}
