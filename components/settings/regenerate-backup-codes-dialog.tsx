'use client'

import { useState } from 'react'
import { Loader2, Key, Copy, Check, AlertTriangle } from 'lucide-react'
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

interface RegenerateBackupCodesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'verify' | 'codes'

export function RegenerateBackupCodesDialog({ open, onOpenChange }: RegenerateBackupCodesDialogProps) {
  const { regenerateBackupCodes, isLoading, error, clearError } = useTwoFactor()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('verify')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedBackup, setCopiedBackup] = useState(false)
  const [savedBackupCodes, setSavedBackupCodes] = useState(false)

  const handleRegenerate = async () => {
    if (!code.trim()) return

    const newCodes = await regenerateBackupCodes(code)
    if (newCodes) {
      setBackupCodes(newCodes)
      setStep('codes')
    }
  }

  const handleClose = () => {
    setStep('verify')
    setCode('')
    setBackupCodes([])
    setCopiedBackup(false)
    setSavedBackupCodes(false)
    clearError()
    onOpenChange(false)
  }

  const copyBackupCodes = async () => {
    const text = backupCodes.join('\n')
    await navigator.clipboard.writeText(text)
    setCopiedBackup(true)
    toast({ title: 'Copied', description: 'Backup codes copied to clipboard' })
    setTimeout(() => setCopiedBackup(false), 2000)
  }

  const downloadBackupCodes = () => {
    const text = `HIVE Two-Factor Authentication Backup Codes\n${'='.repeat(50)}\n\nKeep these codes safe. Each code can only be used once.\nPrevious codes are no longer valid.\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nGenerated: ${new Date().toISOString()}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hive-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
    setSavedBackupCodes(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {step === 'verify' ? 'Regenerate Backup Codes' : 'New Backup Codes'}
          </DialogTitle>
          <DialogDescription>
            {step === 'verify'
              ? 'Enter your authenticator code to generate new backup codes. This will invalidate all previous codes.'
              : 'Save these new backup codes. Your previous codes are no longer valid.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'verify' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Generating new codes will invalidate all existing backup codes.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="verify-code">Authenticator Code</Label>
              <Input
                id="verify-code"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
          </div>
        )}

        {step === 'codes' && (
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
                onClick={handleRegenerate}
                disabled={code.length !== 6 || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate New Codes
              </Button>
            </>
          )}

          {step === 'codes' && (
            <Button
              onClick={handleClose}
              disabled={!savedBackupCodes && !copiedBackup}
              className="w-full"
            >
              {savedBackupCodes || copiedBackup ? 'Done' : 'Save codes to continue'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
