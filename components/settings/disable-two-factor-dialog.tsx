'use client'

import { useState } from 'react'
import { Loader2, ShieldOff, AlertTriangle } from 'lucide-react'
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

interface DisableTwoFactorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDisabled: () => void
}

export function DisableTwoFactorDialog({ open, onOpenChange, onDisabled }: DisableTwoFactorDialogProps) {
  const { disable, isLoading, error, clearError } = useTwoFactor()
  const { toast } = useToast()

  const [code, setCode] = useState('')

  const handleDisable = async () => {
    if (!code.trim()) return

    const success = await disable(code)
    if (success) {
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been removed from your account.',
      })
      onDisabled()
      handleClose()
    }
  }

  const handleClose = () => {
    setCode('')
    clearError()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldOff className="h-5 w-5" />
            Disable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            This will remove 2FA from your account, making it less secure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Disabling 2FA will make your account more vulnerable to unauthorized access.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="disable-code">Authenticator Code</Label>
            <Input
              id="disable-code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              Enter a code from your authenticator app to confirm
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={code.length !== 6 || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Disable 2FA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
