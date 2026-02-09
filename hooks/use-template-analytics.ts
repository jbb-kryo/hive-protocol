'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { format, subDays } from 'date-fns'

export type TimeRange = '7d' | '30d' | '90d' | 'all'

export interface TemplateOverviewStats {
  totalTemplates: number
  activeTemplates: number
  totalClones: number
  totalReviews: number
  averageRating: number
  clonesTrend: number
}

export interface TemplateMetric {
  id: string
  name: string
  category: string
  icon: string
  version: string
  cloneCount: number
  activeAgents: number
  retainedAgents: number
  retentionRate: number
  averageRating: number
  reviewCount: number
  isFeatured: boolean
}

export interface CategoryMetric {
  category: string
  templateCount: number
  totalClones: number
  avgRating: number
  totalReviews: number
  activeAgents: number
}

export interface RatingDistribution {
  rating: number
  count: number
}

export interface CloneTrendPoint {
  date: string
  clones: number
}

export interface RatingTrendPoint {
  date: string
  avgRating: number
  reviewCount: number
}

function getStartDate(range: TimeRange): Date | null {
  switch (range) {
    case '7d': return subDays(new Date(), 7)
    case '30d': return subDays(new Date(), 30)
    case '90d': return subDays(new Date(), 90)
    case 'all': return null
  }
}

export function useTemplateAnalytics() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getOverviewStats = useCallback(async (): Promise<TemplateOverviewStats> => {
    const { data: templates, error: err } = await supabase
      .from('default_agents')
      .select('id, is_active, clone_count, average_rating, review_count')

    if (err) throw err

    const all = templates || []
    const totalTemplates = all.length
    const activeTemplates = all.filter(t => t.is_active).length
    const totalClones = all.reduce((sum, t) => sum + (t.clone_count || 0), 0)
    const totalReviews = all.reduce((sum, t) => sum + (t.review_count || 0), 0)
    const rated = all.filter(t => t.review_count > 0)
    const averageRating = rated.length > 0
      ? rated.reduce((sum, t) => sum + (t.average_rating || 0), 0) / rated.length
      : 0

    return {
      totalTemplates,
      activeTemplates,
      totalClones,
      totalReviews,
      averageRating,
      clonesTrend: 0,
    }
  }, [])

  const getTemplateMetrics = useCallback(async (range: TimeRange): Promise<TemplateMetric[]> => {
    const { data: templates, error: tErr } = await supabase
      .from('default_agents')
      .select('id, name, category, icon, version, clone_count, average_rating, review_count, is_featured, is_active')
      .eq('is_active', true)
      .order('clone_count', { ascending: false })

    if (tErr) throw tErr
    if (!templates) return []

    const startDate = getStartDate(range)
    const templateIds = templates.map(t => t.id)

    let agentsQuery = supabase
      .from('agents')
      .select('id, settings, created_at')
    if (startDate) {
      agentsQuery = agentsQuery.gte('created_at', startDate.toISOString())
    }

    const { data: agents } = await agentsQuery

    const agentsByTemplate: Record<string, { total: number; retained: number }> = {}

    if (agents) {
      const retentionThreshold = subDays(new Date(), 30).toISOString()
      for (const agent of agents) {
        const templateId = (agent.settings as Record<string, unknown>)?.template_id as string | undefined
        if (templateId && templateIds.includes(templateId)) {
          if (!agentsByTemplate[templateId]) {
            agentsByTemplate[templateId] = { total: 0, retained: 0 }
          }
          agentsByTemplate[templateId].total++
          if (agent.created_at <= retentionThreshold) {
            agentsByTemplate[templateId].retained++
          }
        }
      }
    }

    return templates.map(t => {
      const agentData = agentsByTemplate[t.id] || { total: 0, retained: 0 }
      const earlyAgents = agentData.retained
      return {
        id: t.id,
        name: t.name,
        category: t.category,
        icon: t.icon,
        version: t.version || '1.0.0',
        cloneCount: t.clone_count || 0,
        activeAgents: agentData.total,
        retainedAgents: earlyAgents,
        retentionRate: agentData.total > 0 ? (earlyAgents / agentData.total) * 100 : 0,
        averageRating: t.average_rating || 0,
        reviewCount: t.review_count || 0,
        isFeatured: t.is_featured || false,
      }
    })
  }, [])

  const getCategoryMetrics = useCallback(async (range: TimeRange): Promise<CategoryMetric[]> => {
    const { data: templates, error: tErr } = await supabase
      .from('default_agents')
      .select('id, category, clone_count, average_rating, review_count, is_active')
      .eq('is_active', true)

    if (tErr) throw tErr
    if (!templates) return []

    const startDate = getStartDate(range)
    let agentsQuery = supabase.from('agents').select('id, settings, created_at')
    if (startDate) {
      agentsQuery = agentsQuery.gte('created_at', startDate.toISOString())
    }
    const { data: agents } = await agentsQuery

    const templateIds = new Set(templates.map(t => t.id))
    const agentsByTemplate: Record<string, number> = {}
    if (agents) {
      for (const agent of agents) {
        const tid = (agent.settings as Record<string, unknown>)?.template_id as string | undefined
        if (tid && templateIds.has(tid)) {
          agentsByTemplate[tid] = (agentsByTemplate[tid] || 0) + 1
        }
      }
    }

    const categoryMap: Record<string, CategoryMetric> = {}
    for (const t of templates) {
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = {
          category: t.category,
          templateCount: 0,
          totalClones: 0,
          avgRating: 0,
          totalReviews: 0,
          activeAgents: 0,
        }
      }
      const cat = categoryMap[t.category]
      cat.templateCount++
      cat.totalClones += t.clone_count || 0
      cat.totalReviews += t.review_count || 0
      cat.activeAgents += agentsByTemplate[t.id] || 0
    }

    for (const cat of Object.values(categoryMap)) {
      const catTemplates = templates.filter(t => t.category === cat.category && t.review_count > 0)
      cat.avgRating = catTemplates.length > 0
        ? catTemplates.reduce((s, t) => s + (t.average_rating || 0), 0) / catTemplates.length
        : 0
    }

    return Object.values(categoryMap).sort((a, b) => b.totalClones - a.totalClones)
  }, [])

  const getRatingDistribution = useCallback(async (templateId?: string): Promise<RatingDistribution[]> => {
    let query = supabase.from('template_reviews').select('rating')
    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data, error: err } = await query
    if (err) throw err

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const row of data || []) {
      counts[row.rating] = (counts[row.rating] || 0) + 1
    }

    return [5, 4, 3, 2, 1].map(rating => ({ rating, count: counts[rating] }))
  }, [])

  const getCloneTrend = useCallback(async (range: TimeRange): Promise<CloneTrendPoint[]> => {
    const startDate = getStartDate(range) || subDays(new Date(), 365)

    const { data: agents, error: err } = await supabase
      .from('agents')
      .select('settings, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (err) throw err

    const dailyCounts: Record<string, number> = {}
    for (const agent of agents || []) {
      const tid = (agent.settings as Record<string, unknown>)?.template_id as string | undefined
      if (tid) {
        const date = format(new Date(agent.created_at), 'MMM dd')
        dailyCounts[date] = (dailyCounts[date] || 0) + 1
      }
    }

    return Object.entries(dailyCounts).map(([date, clones]) => ({ date, clones }))
  }, [])

  const getRatingTrend = useCallback(async (range: TimeRange): Promise<RatingTrendPoint[]> => {
    const startDate = getStartDate(range) || subDays(new Date(), 365)

    const { data: reviews, error: err } = await supabase
      .from('template_reviews')
      .select('rating, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (err) throw err

    const dailyData: Record<string, { sum: number; count: number }> = {}
    for (const review of reviews || []) {
      const date = format(new Date(review.created_at), 'MMM dd')
      if (!dailyData[date]) {
        dailyData[date] = { sum: 0, count: 0 }
      }
      dailyData[date].sum += review.rating
      dailyData[date].count++
    }

    return Object.entries(dailyData).map(([date, d]) => ({
      date,
      avgRating: d.count > 0 ? d.sum / d.count : 0,
      reviewCount: d.count,
    }))
  }, [])

  const exportCSV = useCallback(async (metrics: TemplateMetric[]) => {
    const headers = [
      'Name', 'Category', 'Version', 'Clones', 'Active Agents',
      'Retained Agents', 'Retention Rate (%)', 'Avg Rating', 'Reviews', 'Featured'
    ]
    const rows = metrics.map(m => [
      m.name,
      m.category,
      m.version,
      m.cloneCount,
      m.activeAgents,
      m.retainedAgents,
      m.retentionRate.toFixed(1),
      m.averageRating.toFixed(2),
      m.reviewCount,
      m.isFeatured ? 'Yes' : 'No',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return {
    loading,
    error,
    getOverviewStats,
    getTemplateMetrics,
    getCategoryMetrics,
    getRatingDistribution,
    getCloneTrend,
    getRatingTrend,
    exportCSV,
  }
}
