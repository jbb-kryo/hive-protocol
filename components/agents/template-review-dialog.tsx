'use client'

import { useState, useEffect } from 'react'
import { MessageSquarePlus, Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { InteractiveStarRating } from '@/components/agents/star-rating'
import { useTemplateReviewActions, type TemplateReview } from '@/hooks/use-template-reviews'

interface TemplateReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  templateName: string
  existingReview?: TemplateReview | null
  onSubmitted?: () => void
}

export function TemplateReviewDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  existingReview,
  onSubmitted,
}: TemplateReviewDialogProps) {
  const { submitReview, updateReview, loading } = useTemplateReviewActions()

  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (open) {
      if (existingReview) {
        setRating(existingReview.rating)
        setTitle(existingReview.title)
        setComment(existingReview.comment)
      } else {
        setRating(5)
        setTitle('')
        setComment('')
      }
    }
  }, [open, existingReview])

  const handleSubmit = async () => {
    if (!title.trim() || !comment.trim()) return

    try {
      if (existingReview) {
        await updateReview(existingReview.id, templateId, { rating, title, comment })
      } else {
        await submitReview(templateId, { rating, title, comment })
      }
      onSubmitted?.()
      onOpenChange(false)
    } catch {
      // handled in hook
    }
  }

  const isEditing = !!existingReview

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Pencil className="w-5 h-5 text-primary" />
            ) : (
              <MessageSquarePlus className="w-5 h-5 text-primary" />
            )}
            {isEditing ? 'Edit Your Review' : 'Write a Review'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your review for' : 'Share your experience with'} &quot;{templateName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Rating</Label>
            <InteractiveStarRating value={rating} onChange={setRating} />
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience..."
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Review</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this template?"
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/2000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleSubmit}
            loading={loading}
            disabled={!title.trim() || !comment.trim()}
          >
            {isEditing ? 'Update Review' : 'Submit Review'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
