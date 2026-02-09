'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface TemplateReview {
  id: string
  template_id: string
  user_id: string
  rating: number
  title: string
  comment: string
  helpful_count: number
  is_flagged: boolean
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    avatar_url: string
  }
}

export interface TemplateRatingStats {
  templateId: string
  averageRating: number
  reviewCount: number
  distribution: Record<number, number>
}

export function useTemplateReviews(templateId: string | null) {
  const [reviews, setReviews] = useState<TemplateReview[]>([])
  const [loading, setLoading] = useState(false)
  const [userReview, setUserReview] = useState<TemplateReview | null>(null)

  const fetchReviews = useCallback(async () => {
    if (!templateId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('template_reviews')
        .select(`
          *,
          user:profiles!template_reviews_user_id_fkey(full_name, avatar_url)
        `)
        .eq('template_id', templateId)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching template reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [templateId])

  const fetchUserReview = useCallback(async () => {
    if (!templateId) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('template_reviews')
        .select('*')
        .eq('template_id', templateId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      setUserReview(data)
    } catch (error) {
      console.error('Error fetching user review:', error)
    }
  }, [templateId])

  useEffect(() => {
    if (templateId) {
      fetchReviews()
      fetchUserReview()
    }
  }, [templateId, fetchReviews, fetchUserReview])

  return { reviews, loading, userReview, refetch: fetchReviews, refetchUserReview: fetchUserReview }
}

export function useTemplateReviewActions() {
  const [loading, setLoading] = useState(false)

  const submitReview = async (templateId: string, review: {
    rating: number
    title: string
    comment: string
  }) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('template_reviews')
        .insert({
          template_id: templateId,
          user_id: user.id,
          ...review,
        })

      if (error) throw error
      await recalculateRating(templateId)
      toast.success('Review submitted')
    } catch (error: any) {
      if (error?.code === '23505') {
        toast.error('You already reviewed this template')
      } else {
        console.error('Error submitting review:', error)
        toast.error('Failed to submit review')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateReview = async (reviewId: string, templateId: string, updates: {
    rating?: number
    title?: string
    comment?: string
  }) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('template_reviews')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', reviewId)

      if (error) throw error
      await recalculateRating(templateId)
      toast.success('Review updated')
    } catch (error) {
      console.error('Error updating review:', error)
      toast.error('Failed to update review')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteReview = async (reviewId: string, templateId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('template_reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error
      await recalculateRating(templateId)
      toast.success('Review deleted')
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Failed to delete review')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const markHelpful = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('template_review_helpful')
        .insert({ review_id: reviewId, user_id: user.id })

      if (error) throw error

      const { data: review } = await supabase
        .from('template_reviews')
        .select('helpful_count')
        .eq('id', reviewId)
        .maybeSingle()

      if (review) {
        await supabase
          .from('template_reviews')
          .update({ helpful_count: (review.helpful_count || 0) + 1 })
          .eq('id', reviewId)
      }
    } catch (error: any) {
      if (error?.code === '23505') {
        toast.error('Already marked as helpful')
      } else {
        console.error('Error marking helpful:', error)
        toast.error('Failed to mark as helpful')
      }
    }
  }

  const flagReview = async (reviewId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('template_reviews')
        .update({ is_flagged: true })
        .eq('id', reviewId)

      if (error) throw error
      toast.success('Review flagged for moderation')
    } catch (error) {
      console.error('Error flagging review:', error)
      toast.error('Failed to flag review')
    } finally {
      setLoading(false)
    }
  }

  const unflagReview = async (reviewId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('template_reviews')
        .update({ is_flagged: false })
        .eq('id', reviewId)

      if (error) throw error
      toast.success('Review restored')
    } catch (error) {
      console.error('Error unflagging review:', error)
      toast.error('Failed to restore review')
    } finally {
      setLoading(false)
    }
  }

  const adminDeleteReview = async (reviewId: string, templateId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('template_reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error
      await recalculateRating(templateId)
      toast.success('Review removed by admin')
    } catch (error) {
      console.error('Error admin-deleting review:', error)
      toast.error('Failed to remove review')
    } finally {
      setLoading(false)
    }
  }

  const fetchFlaggedReviews = async (): Promise<TemplateReview[]> => {
    try {
      const { data, error } = await supabase
        .from('template_reviews')
        .select(`
          *,
          user:profiles!template_reviews_user_id_fkey(full_name, avatar_url)
        `)
        .eq('is_flagged', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching flagged reviews:', error)
      return []
    }
  }

  const fetchAllReviewsForTemplate = async (templateId: string): Promise<TemplateReview[]> => {
    try {
      const { data, error } = await supabase
        .from('template_reviews')
        .select(`
          *,
          user:profiles!template_reviews_user_id_fkey(full_name, avatar_url)
        `)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all reviews:', error)
      return []
    }
  }

  const getRatingStatsForTemplates = async (templateIds: string[]): Promise<Record<string, TemplateRatingStats>> => {
    if (templateIds.length === 0) return {}
    try {
      const { data, error } = await supabase
        .from('default_agents')
        .select('id, average_rating, review_count')
        .in('id', templateIds)

      if (error) throw error

      const stats: Record<string, TemplateRatingStats> = {}
      for (const row of (data || [])) {
        stats[row.id] = {
          templateId: row.id,
          averageRating: Number(row.average_rating) || 0,
          reviewCount: row.review_count || 0,
          distribution: {},
        }
      }
      return stats
    } catch (error) {
      console.error('Error fetching rating stats:', error)
      return {}
    }
  }

  return {
    loading,
    submitReview,
    updateReview,
    deleteReview,
    markHelpful,
    flagReview,
    unflagReview,
    adminDeleteReview,
    fetchFlaggedReviews,
    fetchAllReviewsForTemplate,
    getRatingStatsForTemplates,
  }
}

async function recalculateRating(templateId: string) {
  const { data: reviews } = await supabase
    .from('template_reviews')
    .select('rating')
    .eq('template_id', templateId)
    .eq('is_flagged', false)

  const count = reviews?.length || 0
  const avg = count > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / count
    : 0

  await supabase
    .from('default_agents')
    .update({
      average_rating: Math.round(avg * 100) / 100,
      review_count: count,
    })
    .eq('id', templateId)
}
