'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle, MoreHorizontal, X, Camera, Send, Loader2, CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type FeedbackType = 'bug' | 'feature' | 'question' | 'other'
type ViewMode = 'feedback' | 'nps' | 'success'

const feedbackTypes: { value: FeedbackType; label: string; icon: typeof Bug; description: string }[] = [
  { value: 'bug', label: 'Report a Bug', icon: Bug, description: 'Something isn\'t working correctly' },
  { value: 'feature', label: 'Request Feature', icon: Lightbulb, description: 'Suggest a new feature or improvement' },
  { value: 'question', label: 'Ask a Question', icon: HelpCircle, description: 'Get help with using HIVE' },
  { value: 'other', label: 'Other Feedback', icon: MoreHorizontal, description: 'General comments or suggestions' },
]

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('feedback')
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [npsComment, setNpsComment] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setViewMode('feedback')
        setFeedbackType('bug')
        setSubject('')
        setMessage('')
        setScreenshotUrl(null)
        setNpsScore(null)
        setNpsComment('')
      }, 300)
    }
  }, [open])

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsCapturing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to upload screenshots')
        return
      }

      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage
        .from('feedback-screenshots')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('feedback-screenshots')
        .getPublicUrl(fileName)

      setScreenshotUrl(publicUrl)
      toast.success('Screenshot uploaded')
    } catch {
      toast.error('Failed to upload screenshot')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        type: feedbackType,
        subject: subject.trim(),
        message: message.trim(),
        screenshot_url: screenshotUrl,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        metadata: {
          screen_width: typeof window !== 'undefined' ? window.innerWidth : null,
          screen_height: typeof window !== 'undefined' ? window.innerHeight : null,
        },
      })

      if (error) throw error

      setViewMode('success')
      toast.success('Thank you for your feedback!')
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitNPS = async () => {
    if (npsScore === null) {
      toast.error('Please select a score')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in to submit feedback')
        return
      }

      const { error } = await supabase.from('nps_responses').insert({
        user_id: user.id,
        score: npsScore,
        comment: npsComment.trim() || null,
        trigger: 'widget',
      })

      if (error) throw error

      setViewMode('success')
      toast.success('Thank you for your feedback!')
    } catch {
      toast.error('Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getNPSLabel = (score: number) => {
    if (score <= 6) return 'Detractor'
    if (score <= 8) return 'Passive'
    return 'Promoter'
  }

  const getNPSColor = (score: number) => {
    if (score <= 6) return 'text-red-500'
    if (score <= 8) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow p-0"
        size="icon"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          {viewMode === 'success' ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-center">Thank You!</DialogTitle>
                <DialogDescription className="text-center">
                  Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.
                </DialogDescription>
              </DialogHeader>
              <Button onClick={() => setOpen(false)} className="mt-6">
                Close
              </Button>
            </div>
          ) : viewMode === 'nps' ? (
            <>
              <DialogHeader>
                <DialogTitle>How likely are you to recommend HIVE?</DialogTitle>
                <DialogDescription>
                  On a scale of 0-10, how likely are you to recommend HIVE to a friend or colleague?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Not likely</span>
                    <span className="text-xs text-muted-foreground">Very likely</span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setNpsScore(score)}
                        className={cn(
                          'flex-1 h-10 rounded-md border text-sm font-medium transition-colors',
                          npsScore === score
                            ? score <= 6
                              ? 'bg-red-500 text-white border-red-500'
                              : score <= 8
                              ? 'bg-yellow-500 text-white border-yellow-500'
                              : 'bg-green-500 text-white border-green-500'
                            : 'hover:bg-muted'
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  {npsScore !== null && (
                    <p className={cn('text-sm mt-2 text-center', getNPSColor(npsScore))}>
                      {getNPSLabel(npsScore)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nps-comment">What's the main reason for your score? (Optional)</Label>
                  <Textarea
                    id="nps-comment"
                    placeholder="Tell us more..."
                    value={npsComment}
                    onChange={(e) => setNpsComment(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setViewMode('feedback')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmitNPS}
                  disabled={npsScore === null || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Send Feedback</DialogTitle>
                <DialogDescription>
                  Help us improve HIVE by sharing your thoughts, reporting issues, or requesting features.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <Label>What type of feedback do you have?</Label>
                  <RadioGroup value={feedbackType} onValueChange={(v) => setFeedbackType(v as FeedbackType)}>
                    <div className="grid grid-cols-2 gap-2">
                      {feedbackTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <label
                            key={type.value}
                            className={cn(
                              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                              feedbackType === type.value
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            )}
                          >
                            <RadioGroupItem value={type.value} className="mt-0.5" />
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{type.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief summary of your feedback"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Details *</Label>
                  <Textarea
                    id="message"
                    placeholder={
                      feedbackType === 'bug'
                        ? 'Please describe the issue, including steps to reproduce it...'
                        : feedbackType === 'feature'
                        ? 'Describe the feature you\'d like to see and why it would be helpful...'
                        : 'Share your feedback or question...'
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Screenshot (Optional)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCapturing}
                    >
                      {isCapturing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 mr-2" />
                      )}
                      Upload Screenshot
                    </Button>
                    {screenshotUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">Screenshot attached</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setScreenshotUrl(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('nps')}
                  className="text-muted-foreground"
                >
                  <Star className="h-4 w-4 mr-1" />
                  Rate HIVE
                </Button>
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={!subject.trim() || !message.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
