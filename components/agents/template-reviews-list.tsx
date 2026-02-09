'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, Flag, Trash2, Pencil, MessageSquare, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StarRating } from '@/components/agents/star-rating'
import { useTemplateReviewActions, type TemplateReview } from '@/hooks/use-template-reviews'

interface TemplateReviewsListProps {
  reviews: TemplateReview[]
  loading: boolean
  userReview: TemplateReview | null
  onWriteReview: () => void
  onEditReview: () => void
  onRefresh: () => void
  isAdmin?: boolean
}

export function TemplateReviewsList({
  reviews,
  loading,
  userReview,
  onWriteReview,
  onEditReview,
  onRefresh,
  isAdmin,
}: TemplateReviewsListProps) {
  const { markHelpful, deleteReview, flagReview, adminDeleteReview } = useTemplateReviewActions()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    pct: reviews.length > 0
      ? (reviews.filter((r) => r.rating === stars).length / reviews.length) * 100
      : 0,
  }))

  const handleHelpful = async (reviewId: string) => {
    await markHelpful(reviewId)
    onRefresh()
  }

  const handleDelete = async (review: TemplateReview) => {
    setDeletingId(review.id)
    try {
      if (isAdmin) {
        await adminDeleteReview(review.id, review.template_id)
      } else {
        await deleteReview(review.id, review.template_id)
      }
      onRefresh()
    } finally {
      setDeletingId(null)
    }
  }

  const handleFlag = async (reviewId: string) => {
    await flagReview(reviewId)
    onRefresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
            <div>
              <StarRating rating={averageRating} size="md" />
              <p className="text-xs text-muted-foreground mt-0.5">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
          <div className="space-y-1.5 w-48">
            {distribution.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right text-muted-foreground">{stars}</span>
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className="w-5 text-right text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {userReview ? (
            <Button variant="outline" size="sm" onClick={onEditReview}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit Review
            </Button>
          ) : (
            <Button size="sm" onClick={onWriteReview}>
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Write Review
            </Button>
          )}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No reviews yet</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to share your experience</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3 pr-4">
            <AnimatePresence>
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-lg border border-border p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs">
                          {(review.user?.full_name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-tight">
                          {review.user?.full_name || 'Anonymous'}
                        </p>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="xs" />
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.is_flagged && (
                      <Badge variant="destructive" className="text-[10px]">Flagged</Badge>
                    )}
                  </div>

                  {review.title && (
                    <p className="text-sm font-medium">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleHelpful(review.id)}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {review.helpful_count > 0 ? review.helpful_count : 'Helpful'}
                    </Button>

                    {userReview?.id !== review.id && !isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground"
                        onClick={() => handleFlag(review.id)}
                      >
                        <Flag className="w-3 h-3" />
                      </Button>
                    )}

                    {(userReview?.id === review.id || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(review)}
                        disabled={deletingId === review.id}
                      >
                        {deletingId === review.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
