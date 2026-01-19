'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { ContextBlock } from '@/hooks/use-context'

interface DeleteContextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contextBlock: ContextBlock | null
  onDelete: (id: string) => Promise<void>
}

export function DeleteContextDialog({
  open,
  onOpenChange,
  contextBlock,
  onDelete,
}: DeleteContextDialogProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!contextBlock) return

    setDeleting(true)
    try {
      await onDelete(contextBlock.id)

      toast({
        title: 'Context block deleted',
        description: `${contextBlock.name} has been removed from the shared context.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting context block:', error)
      toast({
        title: 'Failed to delete context block',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Context Block?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{contextBlock?.name}</strong>?
            This will remove it from the shared context and all agents will lose
            access to this information. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Context'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
