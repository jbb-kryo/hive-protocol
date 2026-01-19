'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
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
import { useAdminUsers, type AdminUser } from '@/hooks/use-admin-users'
import { useToast } from '@/hooks/use-toast'

interface DeleteUserDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteUserDialog({ user, open, onOpenChange, onSuccess }: DeleteUserDialogProps) {
  const { deleteUser } = useAdminUsers()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  if (!user) return null

  const handleDelete = async () => {
    try {
      setLoading(true)

      await deleteUser(user.id)

      toast({
        title: 'User deleted',
        description: `${user.full_name || 'User'} has been permanently deleted.`,
      })

      setConfirmation('')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete user',
      })
    } finally {
      setLoading(false)
    }
  }

  const canDelete = confirmation === 'DELETE'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account
            and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Permanent Action</p>
              <p className="text-muted-foreground">
                Deleting {user.full_name || 'this user'} will remove:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>User profile and authentication data</li>
                <li>{user.agent_count} agents</li>
                <li>{user.swarm_count} swarms and all messages</li>
                <li>All activity logs and settings</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirmation"
              placeholder="DELETE"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmation('')
              onOpenChange(false)
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading || !canDelete}
            variant="destructive"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
