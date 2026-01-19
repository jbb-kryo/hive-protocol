'use client'

import { useState } from 'react'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabase'
import { type Tool } from '@/hooks/use-tools'

interface DeleteToolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: Tool | null
  onDeleted: () => void
}

export function DeleteToolDialog({ open, onOpenChange, tool, onDeleted }: DeleteToolDialogProps) {
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (!tool) return
    if (confirmation !== tool.name) {
      setError('Tool name does not match')
      return
    }

    setDeleting(true)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('tools')
        .delete()
        .eq('id', tool.id)

      if (deleteError) throw deleteError

      onDeleted()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tool')
    } finally {
      setDeleting(false)
    }
  }

  const handleClose = () => {
    setConfirmation('')
    setError('')
    onOpenChange(false)
  }

  if (!tool) return null

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Custom Tool
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the tool
            and all its version history.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <p className="text-sm font-medium">{tool.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <span className="font-mono font-semibold">{tool.name}</span> to confirm
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Enter tool name"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || confirmation !== tool.name}
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Tool
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
