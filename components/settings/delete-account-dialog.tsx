'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<'warning' | 'confirm'>('warning')
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProceed = () => {
    setStep('confirm')
  }

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, confirmText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      await supabase.auth.signOut()

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted. We\'re sorry to see you go.',
      })

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (isDeleting) return
    setStep('warning')
    setPassword('')
    setConfirmText('')
    setError(null)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {step === 'warning' ? (
                <>
                  <p>
                    This action is <strong>permanent and cannot be undone</strong>.
                    Deleting your account will:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Delete all your agents and their configurations</li>
                    <li>Delete all your swarms and conversation history</li>
                    <li>Remove all your integrations and API connections</li>
                    <li>Delete all custom tools you&apos;ve created</li>
                    <li>Remove all webhooks and activity logs</li>
                    <li>Cancel any active subscriptions</li>
                  </ul>
                  <p className="text-sm font-medium">
                    You will receive a confirmation email once the deletion is complete.
                  </p>
                </>
              ) : (
                <p>
                  To confirm deletion, enter your password and type <strong>DELETE</strong> below.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === 'confirm' && (
          <div className="space-y-4 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isDeleting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                disabled={isDeleting}
                className="font-mono"
              />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          {step === 'warning' ? (
            <Button
              variant="destructive"
              onClick={handleProceed}
            >
              I understand, continue
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== 'DELETE' || !password}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </>
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
