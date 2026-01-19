'use client';

import { useState } from 'react';
import { useMarketplaceAgent, useMarketplaceActions, MarketplaceReview } from '@/hooks/use-marketplace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface AgentReviewsProps {
  agentId: string;
}

export function AgentReviews({ agentId }: AgentReviewsProps) {
  const { reviews, refetchReviews } = useMarketplaceAgent(agentId);
  const { createReview, markReviewHelpful, loading } = useMarketplaceActions();

  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmitReview = async () => {
    try {
      await createReview(agentId, { rating, title, comment });
      setShowReviewDialog(false);
      setRating(5);
      setTitle('');
      setComment('');
      refetchReviews();
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(reviewId);
      refetchReviews();
    } catch (error) {
      console.error('Failed to mark review helpful:', error);
    }
  };

  const renderStars = (count: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= count
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderInteractiveStars = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-300 dark:text-slate-600'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === stars).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-semibold mb-2">Reviews</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
              {renderStars(Math.round(averageRating), 'lg')}
            </div>
            <span className="text-slate-600 dark:text-slate-400">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </div>
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogTrigger asChild>
            <Button>Write a Review</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience with this agent
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                {renderInteractiveStars()}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  placeholder="Summarize your review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Review</label>
                <Textarea
                  placeholder="What did you like or dislike about this agent?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSubmitReview}
                disabled={loading || !title || !comment}
              >
                Submit Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-24">
                  <span className="text-sm font-medium">{stars}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="h-full bg-yellow-400"
                  />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">
                  {count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Be the first to review this agent!
              </p>
              <Button onClick={() => setShowReviewDialog(true)}>
                Write the First Review
              </Button>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {review.user?.full_name || 'Anonymous'}
                          </span>
                          {review.is_verified_purchase && (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        {renderStars(review.rating)}
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="font-semibold mb-2">{review.title}</h4>
                  )}

                  {review.comment && (
                    <p className="text-slate-600 dark:text-slate-400 mb-4 whitespace-pre-line">
                      {review.comment}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkHelpful(review.id)}
                      className="gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
