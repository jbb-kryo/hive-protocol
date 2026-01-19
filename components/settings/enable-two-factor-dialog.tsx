'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Copy, Check, Shield, Key, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTwoFactor } from '@/hooks/use-two-factor'
import { useToast } from '@/hooks/use-toast'

interface EnableTwoFactorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnabled: () => void
}

type Step = 'setup' | 'verify' | 'backup' | 'complete'

export function EnableTwoFactorDialog({ open, onOpenChange, onEnabled }: EnableTwoFactorDialogProps) {
  const { setup, verify, isLoading, error, clearError } = useTwoFactor()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('setup')
  const [secret, setSecret] = useState('')
  const [otpauthUrl, setOtpauthUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedBackup, setCopiedBackup] = useState(false)
  const [savedBackupCodes, setSavedBackupCodes] = useState(false)

  const handleSetup = useCallback(async () => {
    clearError()
    const data = await setup()
    if (data) {
      setSecret(data.secret)
      setOtpauthUrl(data.otpauthUrl)
      setBackupCodes(data.backupCodes)
      setStep('verify')
    }
  }, [setup, clearError])

  useEffect(() => {
    if (open && step === 'setup') {
      handleSetup()
    }
  }, [open, step, handleSetup])

  const handleVerify = async () => {
    if (!verificationCode.trim()) return

    const success = await verify(verificationCode)
    if (success) {
      setStep('backup')
    }
  }

  const handleComplete = () => {
    toast({
      title: '2FA Enabled',
      description: 'Two-factor authentication is now active on your account.',
    })
    onEnabled()
    handleClose()
  }

  const handleClose = () => {
    setStep('setup')
    setSecret('')
    setOtpauthUrl('')
    setBackupCodes([])
    setVerificationCode('')
    setCopiedSecret(false)
    setCopiedBackup(false)
    setSavedBackupCodes(false)
    clearError()
    onOpenChange(false)
  }

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const copyBackupCodes = async () => {
    const text = backupCodes.join('\n')
    await navigator.clipboard.writeText(text)
    setCopiedBackup(true)
    toast({ title: 'Copied', description: 'Backup codes copied to clipboard' })
    setTimeout(() => setCopiedBackup(false), 2000)
  }

  const downloadBackupCodes = () => {
    const text = `HIVE Two-Factor Authentication Backup Codes\n${'='.repeat(50)}\n\nKeep these codes safe. Each code can only be used once.\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nGenerated: ${new Date().toISOString()}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hive-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
    setSavedBackupCodes(true)
  }

  const qrCodeUrl = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
    : ''

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {step === 'setup' && 'Setting up 2FA'}
            {step === 'verify' && 'Verify Your Authenticator'}
            {step === 'backup' && 'Save Backup Codes'}
            {step === 'complete' && '2FA Enabled'}
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' && 'Preparing your two-factor authentication setup...'}
            {step === 'verify' && 'Scan the QR code with your authenticator app and enter the code.'}
            {step === 'backup' && 'Save these backup codes in a safe place. You will need them if you lose access to your authenticator.'}
            {step === 'complete' && 'Your account is now protected with two-factor authentication.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-2 rounded-lg">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="Two-factor authentication QR code - scan with your authenticator app"
                    width={192}
                    height={192}
                    className="w-48 h-48"
                    loading="eager"
                    decoding="async"
                  />
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Can&apos;t scan? Enter this code manually:
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                    {secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copySecret}
                  >
                    {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                These codes will only be shown once. Save them now!
              </AlertDescription>
            </Alert>

            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="font-mono text-sm bg-background px-3 py-1.5 rounded text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyBackupCodes}
              >
                {copiedBackup ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={downloadBackupCodes}
              >
                <Key className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'verify' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verify
              </Button>
            </>
          )}

          {step === 'backup' && (
            <Button
              onClick={handleComplete}
              disabled={!savedBackupCodes && !copiedBackup}
              className="w-full"
            >
              {savedBackupCodes || copiedBackup ? 'Complete Setup' : 'Save codes to continue'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
