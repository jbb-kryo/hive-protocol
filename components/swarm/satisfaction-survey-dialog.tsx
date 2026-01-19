'use client';

import { useState } from 'react';
import { useSatisfactionRatings } from '@/hooks/use-agent-analytics';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, Zap, Target, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SatisfactionSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  swarmId: string;
  conversationMetricId?: string;
}

const FEEDBACK_CATEGORIES = [
  { id: 'helpful', label: 'Helpful', icon: ThumbsUp },
  { id: 'fast', label: 'Fast', icon: Zap },
  { id: 'accurate', label: 'Accurate', icon: Target },
  { id: 'confusing', label: 'Confusing', icon: AlertCircle },
  { id: 'incomplete', label: 'Incomplete', icon: AlertCircle },
  { id: 'slow', label: 'Slow', icon: AlertCircle },
];

export function SatisfactionSurveyDialog({
  open,
  onOpenChange,
  agentId,
  swarmId,
  conversationMetricId,
}: SatisfactionSurveyDialogProps) {
  const { submitRating } = useSatisfactionRatings(agentId);

  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitRating(swarmId, conversationMetricId || null, {
        rating,
        feedback_text: feedbackText,
        feedback_categories: selectedCategories,
        would_recommend: wouldRecommend,
      });
      onOpenChange(false);
      setRating(5);
      setFeedbackText('');
      setSelectedCategories([]);
      setWouldRecommend(true);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How was your experience?</DialogTitle>
          <DialogDescription>
            Your feedback helps us improve agent performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3 text-center">
              Rate this conversation
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="transition-all"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            <div className="text-center mt-2 text-sm text-slate-600 dark:text-slate-400">
              {rating === 5 && 'Excellent!'}
              {rating === 4 && 'Good'}
              {rating === 3 && 'Okay'}
              {rating === 2 && 'Poor'}
              {rating === 1 && 'Very Poor'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              What describes your experience? (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_CATEGORIES.map(({ id, label, icon: Icon }) => (
                <Badge
                  key={id}
                  variant={selectedCategories.includes(id) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => toggleCategory(id)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Additional feedback (optional)
            </label>
            <Textarea
              placeholder="Tell us more about your experience..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Would you recommend this agent?
            </label>
            <div className="flex gap-4">
              <Button
                variant={wouldRecommend ? 'default' : 'outline'}
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Yes
              </Button>
              <Button
                variant={!wouldRecommend ? 'default' : 'outline'}
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                No
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={submitting}
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
