'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Shield, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { acceptTermsOfService } from '@/lib/auth'

interface TosReacceptanceDialogProps {
  open: boolean
  onAccept: () => void
  currentTosVersion: string
  currentPrivacyVersion: string
}

export function TosReacceptanceDialog({
  open,
  onAccept,
  currentTosVersion,
  currentPrivacyVersion,
}: TosReacceptanceDialogProps) {
  const [tosAccepted, setTosAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAccept = async () => {
    if (!tosAccepted) {
      setError('You must accept the updated terms to continue')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await acceptTermsOfService()
      onAccept()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept terms')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Updated Terms of Service</DialogTitle>
          <DialogDescription className="text-center">
            We have updated our Terms of Service and Privacy Policy. Please review and accept the new terms to continue using HIVE Protocol.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/terms"
              target="_blank"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Terms of Service</p>
                <p className="text-xs text-muted-foreground">v{currentTosVersion}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
            </Link>

            <Link
              href="/privacy"
              target="_blank"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Privacy Policy</p>
                <p className="text-xs text-muted-foreground">v{currentPrivacyVersion}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
            </Link>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="accept-tos"
              checked={tosAccepted}
              onCheckedChange={(checked) => setTosAccepted(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="accept-tos" className="text-sm font-normal leading-relaxed cursor-pointer">
              I have read and agree to the updated{' '}
              <Link href="/terms" target="_blank" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
        </div>

        <DialogFooter>
          <LoadingButton
            onClick={handleAccept}
            disabled={!tosAccepted}
            loading={isLoading}
            className="w-full"
          >
            Accept and Continue
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
