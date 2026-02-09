'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, MessageSquare, Trash2, Flag, FlagOff, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StarRating } from '@/components/agents/star-rating'
import {
  useTemplateReviewActions,
  type TemplateReview,
} from '@/hooks/use-template-reviews'

interface TemplateReviewsModerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  templateName: string
}

export function TemplateReviewsModerationDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
}: TemplateReviewsModerationDialogProps) {
  const {
    fetchAllReviewsForTemplate,
    fetchFlaggedReviews,
    adminDeleteReview,
    flagReview,
    unflagReview,
  } = useTemplateReviewActions()

  const [allReviews, setAllReviews] = useState<TemplateReview[]>([])
  const [flaggedReviews, setFlaggedReviews] = useState<TemplateReview[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<TemplateReview | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [all, flagged] = await Promise.all([
      fetchAllReviewsForTemplate(templateId),
      fetchFlaggedReviews(),
    ])
    setAllReviews(all)
    setFlaggedReviews(flagged.filter((r) => r.template_id === templateId))
    setLoading(false)
  }, [templateId, fetchAllReviewsForTemplate, fetchFlaggedReviews])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const handleFlag = async (review: TemplateReview) => {
    setActionLoadingId(review.id)
    await flagReview(review.id)
    await load()
    setActionLoadingId(null)
  }

  const handleUnflag = async (review: TemplateReview) => {
    setActionLoadingId(review.id)
    await unflagReview(review.id)
    await load()
    setActionLoadingId(null)
  }

  const handleDeleteConfirm = (review: TemplateReview) => {
    setReviewToDelete(review)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!reviewToDelete) return
    setActionLoadingId(reviewToDelete.id)
    await adminDeleteReview(reviewToDelete.id, reviewToDelete.template_id)
    setDeleteConfirmOpen(false)
    setReviewToDelete(null)
    await load()
    setActionLoadingId(null)
  }

  const ReviewCard = ({ review }: { review: TemplateReview }) => (
    <div className={`rounded-lg border p-4 space-y-2 ${review.is_flagged ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-[10px]">
              {(review.user?.full_name || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{review.user?.full_name || 'Anonymous'}</p>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="xs" />
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {review.is_flagged ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleUnflag(review)}
              disabled={actionLoadingId === review.id}
            >
              {actionLoadingId === review.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <FlagOff className="w-3 h-3 mr-1" />
              )}
              Restore
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-amber-600"
              onClick={() => handleFlag(review)}
              disabled={actionLoadingId === review.id}
            >
              {actionLoadingId === review.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Flag className="w-3 h-3 mr-1" />
              )}
              Flag
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => handleDeleteConfirm(review)}
            disabled={actionLoadingId === review.id}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      {review.title && <p className="text-sm font-medium">{review.title}</p>}
      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
      {review.is_flagged && (
        <Badge variant="destructive" className="text-[10px]">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Flagged - Hidden from users
        </Badge>
      )}
    </div>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Review Moderation
            </DialogTitle>
            <DialogDescription>
              Manage reviews for &quot;{templateName}&quot;
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="all" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid grid-cols-2 w-full shrink-0">
                <TabsTrigger value="all">
                  All ({allReviews.length})
                </TabsTrigger>
                <TabsTrigger value="flagged" className="gap-1.5">
                  Flagged
                  {flaggedReviews.length > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1">
                      {flaggedReviews.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[400px]">
                  {allReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No reviews for this template
                    </p>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {allReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="flagged" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[400px]">
                  {flaggedReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No flagged reviews
                    </p>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {flaggedReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove this review by {reviewToDelete?.user?.full_name || 'Anonymous'}?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
