'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { Message } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface FlagMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: Message | null
}

const FLAG_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'incorrect', label: 'Factually incorrect' },
  { value: 'harmful', label: 'Potentially harmful advice' },
  { value: 'off-topic', label: 'Off-topic or irrelevant' },
  { value: 'spam', label: 'Spam or promotional' },
  { value: 'other', label: 'Other' },
]

export function FlagMessageDialog({ open, onOpenChange, message }: FlagMessageDialogProps) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!message || !reason) return

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('message_flags')
        .insert({
          message_id: message.id,
          swarm_id: message.swarm_id,
          flagged_by: user?.id,
          reason,
          details: details.trim() || null,
        })

      if (error) throw error

      toast({
        title: 'Message flagged',
        description: 'Thank you for your feedback. We will review this message.',
      })

      setReason('')
      setDetails('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error flagging message:', error)
      toast({
        title: 'Failed to flag message',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setDetails('')
    onOpenChange(false)
  }

  if (!message) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Flag Message
          </DialogTitle>
          <DialogDescription>
            Report this message for review. Flagged messages help us improve the quality of AI responses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {message.content}
            </p>
          </div>

          <div className="space-y-3">
            <Label>Reason for flagging</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {FLAG_REASONS.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={item.value} id={item.value} />
                  <Label htmlFor={item.value} className="font-normal cursor-pointer">
                    {item.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide any additional context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Flag'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
