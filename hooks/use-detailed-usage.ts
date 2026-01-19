'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'

export interface AIUsageRecord {
  id: string
  user_id: string
  swarm_id: string | null
  agent_id: string | null
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  input_cost: number
  output_cost: number
  total_cost: number
  latency_ms: number
  status: string
  created_at: string
  agent?: {
    name: string
  }
  swarm?: {
    name: string
  }
}

export interface UsageByModel {
  model: string
  provider: string
  total_requests: number
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  total_cost: number
  avg_latency: number
}

export interface UsageByAgent {
  agent_id: string
  agent_name: string
  total_requests: number
  total_tokens: number
  total_cost: number
}

export interface DailyUsage {
  date: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  total_cost: number
  request_count: number
}

export interface UsageSummary {
  total_requests: number
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  total_cost: number
  avg_latency: number
  unique_models: number
  unique_agents: number
}

export interface PlanLimits {
  plan: string
  messages_per_day: number
  requests_per_day: number
  tokens_per_day: number
  max_agents: number
  max_swarms: number
}

export interface CurrentUsage {
  messages_today: number
  requests_today: number
  tokens_today: number
  agents_count: number
  swarms_count: number
}

export type DateRange = '7d' | '30d' | '90d' | 'all'

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude-3.5-sonnet': { input: 0.003, output: 0.015 },
}

function generateMockData(dateRange: DateRange) {
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 180

  const dailyUsage: DailyUsage[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const baseTokens = Math.floor(Math.random() * 10000) + 2000
    const inputTokens = Math.floor(baseTokens * 0.6)
    const outputTokens = baseTokens - inputTokens
    dailyUsage.push({
      date: date.toISOString().split('T')[0],
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: baseTokens,
      total_cost: baseTokens * 0.000003,
      request_count: Math.floor(Math.random() * 20) + 5,
    })
  }

  const usageByModel: UsageByModel[] = [
    { model: 'gpt-4o', provider: 'openai', total_requests: 245, total_input_tokens: 89000, total_output_tokens: 45000, total_tokens: 134000, total_cost: 1.12, avg_latency: 2450 },
    { model: 'gpt-4o-mini', provider: 'openai', total_requests: 580, total_input_tokens: 125000, total_output_tokens: 62000, total_tokens: 187000, total_cost: 0.56, avg_latency: 890 },
    { model: 'claude-3.5-sonnet', provider: 'anthropic', total_requests: 156, total_input_tokens: 67000, total_output_tokens: 34000, total_tokens: 101000, total_cost: 0.71, avg_latency: 1820 },
    { model: 'gpt-3.5-turbo', provider: 'openai', total_requests: 890, total_input_tokens: 245000, total_output_tokens: 123000, total_tokens: 368000, total_cost: 0.31, avg_latency: 520 },
  ]

  const usageByAgent: UsageByAgent[] = [
    { agent_id: '1', agent_name: 'Research Assistant', total_requests: 423, total_tokens: 234000, total_cost: 0.89 },
    { agent_id: '2', agent_name: 'Code Reviewer', total_requests: 289, total_tokens: 156000, total_cost: 0.62 },
    { agent_id: '3', agent_name: 'Content Writer', total_requests: 567, total_tokens: 289000, total_cost: 1.12 },
    { agent_id: '4', agent_name: 'Data Analyzer', total_requests: 192, total_tokens: 111000, total_cost: 0.45 },
  ]

  const summary: UsageSummary = {
    total_requests: 1871,
    total_input_tokens: 526000,
    total_output_tokens: 264000,
    total_tokens: 790000,
    total_cost: 2.70,
    avg_latency: 1420,
    unique_models: 4,
    unique_agents: 4,
  }

  return { dailyUsage, usageByModel, usageByAgent, summary }
}

export function useDetailedUsage() {
  const { user, isDemo } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([])
  const [usageByModel, setUsageByModel] = useState<UsageByModel[]>([])
  const [usageByAgent, setUsageByAgent] = useState<UsageByAgent[]>([])
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [recentRecords, setRecentRecords] = useState<AIUsageRecord[]>([])
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null)
  const [currentUsage, setCurrentUsage] = useState<CurrentUsage | null>(null)

  const fetchDetailedUsage = useCallback(async (range: DateRange = dateRange) => {
    if (isDemo || !user) {
      const mockData = generateMockData(range)
      setDailyUsage(mockData.dailyUsage)
      setUsageByModel(mockData.usageByModel)
      setUsageByAgent(mockData.usageByAgent)
      setSummary(mockData.summary)
      setPlanLimits({
        plan: 'pro',
        messages_per_day: 1000,
        requests_per_day: 500,
        tokens_per_day: 500000,
        max_agents: 20,
        max_swarms: 10,
      })
      setCurrentUsage({
        messages_today: 45,
        requests_today: 23,
        tokens_today: 12500,
        agents_count: 5,
        swarms_count: 3,
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const [
        { data: usageData, error: usageError },
        { data: limitsData, error: limitsError },
        { data: dailyData, error: dailyError },
      ] = await Promise.all([
        supabase
          .from('ai_usage')
          .select(`
            *,
            agent:agents(name),
            swarm:swarms(name)
          `)
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('plan_rate_limits')
          .select('*')
          .eq('plan', 'free')
          .maybeSingle(),
        supabase
          .from('usage_summaries')
          .select('*')
          .eq('user_id', user.id)
          .eq('period_type', 'day')
          .gte('period_start', startDate.toISOString().split('T')[0])
          .order('period_start', { ascending: true }),
      ])

      if (usageError) throw usageError
      if (limitsError) throw limitsError
      if (dailyError) throw dailyError

      const records = (usageData || []) as AIUsageRecord[]
      setRecentRecords(records.slice(0, 100))

      const modelAgg: Record<string, UsageByModel> = {}
      const agentAgg: Record<string, UsageByAgent> = {}
      let totalRequests = 0
      let totalInputTokens = 0
      let totalOutputTokens = 0
      let totalCost = 0
      let totalLatency = 0

      for (const record of records) {
        totalRequests++
        totalInputTokens += record.input_tokens || 0
        totalOutputTokens += record.output_tokens || 0
        totalCost += Number(record.total_cost) || 0
        totalLatency += record.latency_ms || 0

        const modelKey = record.model
        if (!modelAgg[modelKey]) {
          modelAgg[modelKey] = {
            model: record.model,
            provider: record.provider,
            total_requests: 0,
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_tokens: 0,
            total_cost: 0,
            avg_latency: 0,
          }
        }
        modelAgg[modelKey].total_requests++
        modelAgg[modelKey].total_input_tokens += record.input_tokens || 0
        modelAgg[modelKey].total_output_tokens += record.output_tokens || 0
        modelAgg[modelKey].total_tokens += record.total_tokens || 0
        modelAgg[modelKey].total_cost += Number(record.total_cost) || 0
        modelAgg[modelKey].avg_latency += record.latency_ms || 0

        if (record.agent_id && record.agent) {
          if (!agentAgg[record.agent_id]) {
            agentAgg[record.agent_id] = {
              agent_id: record.agent_id,
              agent_name: record.agent.name || 'Unknown Agent',
              total_requests: 0,
              total_tokens: 0,
              total_cost: 0,
            }
          }
          agentAgg[record.agent_id].total_requests++
          agentAgg[record.agent_id].total_tokens += record.total_tokens || 0
          agentAgg[record.agent_id].total_cost += Number(record.total_cost) || 0
        }
      }

      for (const key of Object.keys(modelAgg)) {
        modelAgg[key].avg_latency = Math.round(modelAgg[key].avg_latency / modelAgg[key].total_requests)
      }

      setUsageByModel(Object.values(modelAgg).sort((a, b) => b.total_cost - a.total_cost))
      setUsageByAgent(Object.values(agentAgg).sort((a, b) => b.total_cost - a.total_cost))

      setSummary({
        total_requests: totalRequests,
        total_input_tokens: totalInputTokens,
        total_output_tokens: totalOutputTokens,
        total_tokens: totalInputTokens + totalOutputTokens,
        total_cost: totalCost,
        avg_latency: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
        unique_models: Object.keys(modelAgg).length,
        unique_agents: Object.keys(agentAgg).length,
      })

      const dailyUsageData: DailyUsage[] = (dailyData || []).map((d: Record<string, unknown>) => ({
        date: d.period_start as string,
        input_tokens: (d.tokens_input as number) || 0,
        output_tokens: (d.tokens_output as number) || 0,
        total_tokens: (d.tokens_used as number) || 0,
        total_cost: Number(d.estimated_cost) || 0,
        request_count: (d.ai_requests_count as number) || 0,
      }))
      setDailyUsage(dailyUsageData)

      if (limitsData) {
        setPlanLimits({
          plan: limitsData.plan,
          messages_per_day: limitsData.messages_per_day,
          requests_per_day: limitsData.requests_per_day,
          tokens_per_day: limitsData.tokens_per_day,
          max_agents: limitsData.max_agents,
          max_swarms: limitsData.max_swarms,
        })
      }

      const todayData = dailyData?.find(
        (d: Record<string, unknown>) => d.period_start === new Date().toISOString().split('T')[0]
      )
      const [{ count: agentsCount }, { count: swarmsCount }] = await Promise.all([
        supabase.from('agents').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('swarms').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      setCurrentUsage({
        messages_today: (todayData?.messages_count as number) || 0,
        requests_today: (todayData?.ai_requests_count as number) || 0,
        tokens_today: (todayData?.tokens_used as number) || 0,
        agents_count: agentsCount || 0,
        swarms_count: swarmsCount || 0,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch usage data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [user, isDemo, dateRange])

  const exportUsageCSV = useCallback(() => {
    if (recentRecords.length === 0 && dailyUsage.length === 0) {
      return ''
    }

    const headers = ['Date', 'Model', 'Provider', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost ($)', 'Latency (ms)', 'Agent']
    const rows = recentRecords.map((r) => [
      new Date(r.created_at).toISOString(),
      r.model,
      r.provider,
      r.input_tokens,
      r.output_tokens,
      r.total_tokens,
      Number(r.total_cost).toFixed(6),
      r.latency_ms,
      r.agent?.name || '',
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    return csv
  }, [recentRecords, dailyUsage])

  const downloadCSV = useCallback(() => {
    const csv = exportUsageCSV()
    if (!csv) return

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `ai-usage-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [exportUsageCSV, dateRange])

  const getUsagePercentage = useCallback(
    (type: 'messages' | 'requests' | 'tokens' | 'agents' | 'swarms') => {
      if (!planLimits || !currentUsage) return 0

      switch (type) {
        case 'messages':
          return Math.min(100, (currentUsage.messages_today / planLimits.messages_per_day) * 100)
        case 'requests':
          return Math.min(100, (currentUsage.requests_today / planLimits.requests_per_day) * 100)
        case 'tokens':
          return Math.min(100, (currentUsage.tokens_today / planLimits.tokens_per_day) * 100)
        case 'agents':
          return Math.min(100, (currentUsage.agents_count / planLimits.max_agents) * 100)
        case 'swarms':
          return Math.min(100, (currentUsage.swarms_count / planLimits.max_swarms) * 100)
      }
    },
    [planLimits, currentUsage]
  )

  const isApproachingLimit = useCallback(
    (type: 'messages' | 'requests' | 'tokens' | 'agents' | 'swarms', threshold = 80) => {
      return getUsagePercentage(type) >= threshold
    },
    [getUsagePercentage]
  )

  return {
    loading,
    error,
    dateRange,
    setDateRange,
    dailyUsage,
    usageByModel,
    usageByAgent,
    summary,
    recentRecords,
    planLimits,
    currentUsage,
    fetchDetailedUsage,
    exportUsageCSV,
    downloadCSV,
    getUsagePercentage,
    isApproachingLimit,
    modelCosts: MODEL_COSTS,
  }
}
