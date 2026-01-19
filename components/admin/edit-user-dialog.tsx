'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdminUsers, type AdminUser } from '@/hooks/use-admin-users'
import { useToast } from '@/hooks/use-toast'

interface EditUserDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
  const { updateUser } = useAdminUsers()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    if (user) {
      setPlan(user.plan)
      setRole(user.role)
    }
  }, [user])

  if (!user) return null

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const updates: { userId: string; plan?: string; role?: string } = {
        userId: user.id,
      }

      if (plan !== user.plan) updates.plan = plan
      if (role !== user.role) updates.role = role

      if (Object.keys(updates).length === 1) {
        onOpenChange(false)
        return
      }

      await updateUser(updates)

      toast({
        title: 'User updated',
        description: `${user.full_name || 'User'} has been updated successfully.`,
      })

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update user',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update {user.full_name || 'user'}&apos;s account settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Subscription Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Changing the plan will immediately update the user&apos;s access level.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Admins have access to the admin dashboard and can manage all users.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
