'use client'

import { useState } from 'react'
import { Ban, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminUsers, type AdminUser } from '@/hooks/use-admin-users'
import { useToast } from '@/hooks/use-toast'

interface SuspendUserDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SuspendUserDialog({ user, open, onOpenChange, onSuccess }: SuspendUserDialogProps) {
  const { updateUser } = useAdminUsers()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')

  if (!user) return null

  const isSuspending = !user.suspended

  const handleSubmit = async () => {
    try {
      setLoading(true)

      await updateUser({
        userId: user.id,
        suspended: isSuspending,
        suspendedReason: isSuspending ? reason : undefined,
      })

      toast({
        title: isSuspending ? 'User suspended' : 'User unsuspended',
        description: isSuspending
          ? `${user.full_name || 'User'} has been suspended and can no longer access their account.`
          : `${user.full_name || 'User'} has been unsuspended and can now access their account.`,
      })

      setReason('')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update user status',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuspending ? (
              <>
                <Ban className="h-5 w-5 text-destructive" />
                Suspend User
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Unsuspend User
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSuspending
              ? `Are you sure you want to suspend ${user.full_name || 'this user'}? They will not be able to access their account.`
              : `Are you sure you want to unsuspend ${user.full_name || 'this user'}? They will regain access to their account.`}
          </DialogDescription>
        </DialogHeader>

        {isSuspending && (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">Warning</p>
                <p className="text-muted-foreground">
                  Suspended users cannot log in or access any platform features. All their
                  swarms will become inactive.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Suspension Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter a reason for suspending this user..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                This reason will be stored for record-keeping purposes.
              </p>
            </div>
          </div>
        )}

        {!isSuspending && user.suspended_reason && (
          <div className="py-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-1">Previous Suspension Reason:</p>
              <p className="text-sm text-muted-foreground">{user.suspended_reason}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant={isSuspending ? 'destructive' : 'default'}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSuspending ? 'Suspend User' : 'Unsuspend User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
