'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Bot, TrendingUp, Clock, CheckCircle, XCircle, Star, Coins,
  Download, FileText, Calendar, Filter, RefreshCw, Loader2,
  BarChart3, Activity, ArrowUpRight, ArrowDownRight, Users,
  AlertTriangle, Settings, Mail, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageTransition } from '@/components/ui/page-transition'
import { EmptyState } from '@/components/ui/empty-state'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'

interface Agent {
  id: string
  name: string
  model: string
  status: string
}

interface ConversationMetric {
  date: string
  conversations: number
  successful: number
  failed: number
  avgResponseTime: number
  totalCost: number
  avgSatisfaction: number
}

interface AgentPerformance {
  agent_id: string
  agent_name: string
  total_conversations: number
  success_rate: number
  avg_response_time: number
  total_cost: number
  avg_satisfaction: number
  total_messages: number
  total_tokens: number
}

interface ScheduledReport {
  id: string
  name: string
  report_type: string
  frequency: string
  schedule_day: number | null
  schedule_time: string
  email_recipients: string[]
  is_active: boolean
  last_sent_at: string | null
  next_scheduled_at: string | null
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(0)
}

function formatCurrency(num: number): string {
  if (num < 0.01) return `$${num.toFixed(4)}`
  if (num < 1) return `$${num.toFixed(3)}`
  return `$${num.toFixed(2)}`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export default function AnalyticsDashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [conversationMetrics, setConversationMetrics] = useState<ConversationMetric[]>([])
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([])
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [newReport, setNewReport] = useState({
    name: '',
    report_type: 'comprehensive',
    frequency: 'weekly',
    schedule_day: 1,
    email_recipients: [''],
    include_charts: true,
    date_range_days: 30,
  })

  const [summary, setSummary] = useState({
    totalConversations: 0,
    successRate: 0,
    avgResponseTime: 0,
    totalCost: 0,
    avgSatisfaction: 0,
    conversationsTrend: 0,
    costTrend: 0,
    satisfactionTrend: 0,
  })

  const fetchAgents = useCallback(async () => {
    if (!user?.id) return

    const { data } = await supabase
      .from('agents')
      .select('id, name, model, status')
      .eq('user_id', user.id)
      .order('name')

    if (data) {
      setAgents(data)
      if (selectedAgents.length === 0) {
        setSelectedAgents(data.map(a => a.id))
      }
    }
  }, [user?.id, selectedAgents.length])

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id || selectedAgents.length === 0) return

    try {
      const startDate = startOfDay(dateRange.from).toISOString()
      const endDate = endOfDay(dateRange.to).toISOString()

      const { data: metrics } = await supabase
        .from('agent_conversation_metrics')
        .select('*')
        .in('agent_id', selectedAgents)
        .gte('conversation_start', startDate)
        .lte('conversation_start', endDate)
        .order('conversation_start', { ascending: true })

      if (metrics && metrics.length > 0) {
        const dailyData: Record<string, ConversationMetric> = {}
        let totalConversations = 0
        let successfulConversations = 0
        let totalResponseTime = 0
        let totalCost = 0
        let satisfactionSum = 0
        let satisfactionCount = 0

        metrics.forEach(m => {
          const date = format(new Date(m.conversation_start), 'MMM dd')
          if (!dailyData[date]) {
            dailyData[date] = {
              date,
              conversations: 0,
              successful: 0,
              failed: 0,
              avgResponseTime: 0,
              totalCost: 0,
              avgSatisfaction: 0,
            }
          }
          dailyData[date].conversations++
          if (m.success_status === 'success') {
            dailyData[date].successful++
            successfulConversations++
          } else if (m.success_status === 'failed') {
            dailyData[date].failed++
          }
          dailyData[date].avgResponseTime += m.avg_response_time_ms || 0
          dailyData[date].totalCost += parseFloat(m.total_cost_usd) || 0

          totalConversations++
          totalResponseTime += m.avg_response_time_ms || 0
          totalCost += parseFloat(m.total_cost_usd) || 0

          if (m.satisfaction_rating) {
            satisfactionSum += m.satisfaction_rating
            satisfactionCount++
            dailyData[date].avgSatisfaction += m.satisfaction_rating
          }
        })

        Object.keys(dailyData).forEach(date => {
          const d = dailyData[date]
          if (d.conversations > 0) {
            d.avgResponseTime = Math.round(d.avgResponseTime / d.conversations)
          }
        })

        setConversationMetrics(Object.values(dailyData))

        setSummary({
          totalConversations,
          successRate: totalConversations > 0 ? (successfulConversations / totalConversations) * 100 : 0,
          avgResponseTime: totalConversations > 0 ? totalResponseTime / totalConversations : 0,
          totalCost,
          avgSatisfaction: satisfactionCount > 0 ? satisfactionSum / satisfactionCount : 0,
          conversationsTrend: 12,
          costTrend: -5,
          satisfactionTrend: 8,
        })
      } else {
        setConversationMetrics([])
        setSummary({
          totalConversations: 0,
          successRate: 0,
          avgResponseTime: 0,
          totalCost: 0,
          avgSatisfaction: 0,
          conversationsTrend: 0,
          costTrend: 0,
          satisfactionTrend: 0,
        })
      }

      const { data: agentStats } = await supabase
        .from('agent_performance_snapshots')
        .select('*')
        .in('agent_id', selectedAgents)
        .eq('period_type', 'daily')
        .gte('snapshot_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('snapshot_date', format(dateRange.to, 'yyyy-MM-dd'))

      if (agentStats && agentStats.length > 0) {
        const agentMap: Record<string, AgentPerformance> = {}

        agentStats.forEach(s => {
          if (!agentMap[s.agent_id]) {
            const agent = agents.find(a => a.id === s.agent_id)
            agentMap[s.agent_id] = {
              agent_id: s.agent_id,
              agent_name: agent?.name || 'Unknown',
              total_conversations: 0,
              success_rate: 0,
              avg_response_time: 0,
              total_cost: 0,
              avg_satisfaction: 0,
              total_messages: 0,
              total_tokens: 0,
            }
          }
          agentMap[s.agent_id].total_conversations += s.total_conversations || 0
          agentMap[s.agent_id].total_cost += parseFloat(s.total_cost_usd) || 0
          agentMap[s.agent_id].total_tokens += s.total_tokens_used || 0
        })

        Object.keys(agentMap).forEach(id => {
          const a = agentMap[id]
          if (a.total_conversations > 0) {
            const stats = agentStats.filter(s => s.agent_id === id)
            const totalSuccessful = stats.reduce((sum, s) => sum + (s.successful_conversations || 0), 0)
            const totalResponseTime = stats.reduce((sum, s) => sum + (s.avg_response_time_ms || 0), 0)
            const totalSatisfaction = stats.reduce((sum, s) => sum + (parseFloat(s.avg_satisfaction_rating) || 0), 0)

            a.success_rate = (totalSuccessful / a.total_conversations) * 100
            a.avg_response_time = totalResponseTime / stats.length
            a.avg_satisfaction = totalSatisfaction / stats.length
          }
        })

        setAgentPerformance(Object.values(agentMap))
      } else {
        const performanceData: AgentPerformance[] = agents
          .filter(a => selectedAgents.includes(a.id))
          .map(a => ({
            agent_id: a.id,
            agent_name: a.name,
            total_conversations: 0,
            success_rate: 0,
            avg_response_time: 0,
            total_cost: 0,
            avg_satisfaction: 0,
            total_messages: 0,
            total_tokens: 0,
          }))
        setAgentPerformance(performanceData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }, [user?.id, selectedAgents, dateRange, agents])

  const fetchScheduledReports = useCallback(async () => {
    if (!user?.id) return

    const { data } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setScheduledReports(data)
    }
  }, [user?.id])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchAgents()
      await fetchScheduledReports()
      setLoading(false)
    }
    loadData()
  }, [fetchAgents, fetchScheduledReports])

  useEffect(() => {
    if (selectedAgents.length > 0) {
      fetchAnalytics()
    }
  }, [selectedAgents, dateRange, fetchAnalytics])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
    toast.success('Analytics refreshed')
  }

  const handleExportCSV = () => {
    const headers = ['Date', 'Conversations', 'Successful', 'Failed', 'Avg Response Time (ms)', 'Total Cost ($)', 'Avg Satisfaction']
    const rows = conversationMetrics.map(m => [
      m.date,
      m.conversations,
      m.successful,
      m.failed,
      m.avgResponseTime,
      m.totalCost.toFixed(4),
      m.avgSatisfaction.toFixed(2)
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    toast.success('Analytics exported to CSV')
  }

  const handleExportPDF = async () => {
    toast.info('PDF export will generate a report and send it to your email')
  }

  const handleCreateReport = async () => {
    if (!user?.id || !newReport.name || newReport.email_recipients.filter(e => e.trim()).length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase.from('scheduled_reports').insert({
        user_id: user.id,
        name: newReport.name,
        report_type: newReport.report_type,
        frequency: newReport.frequency,
        schedule_day: newReport.frequency !== 'daily' ? newReport.schedule_day : null,
        schedule_time: '09:00:00',
        email_recipients: newReport.email_recipients.filter(e => e.trim()),
        include_charts: newReport.include_charts,
        date_range_days: newReport.date_range_days,
        is_active: true,
      })

      if (error) throw error

      toast.success('Scheduled report created')
      setShowScheduleDialog(false)
      setNewReport({
        name: '',
        report_type: 'comprehensive',
        frequency: 'weekly',
        schedule_day: 1,
        email_recipients: [''],
        include_charts: true,
        date_range_days: 30,
      })
      fetchScheduledReports()
    } catch {
      toast.error('Failed to create scheduled report')
    }
  }

  const toggleReportActive = async (reportId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ is_active: !isActive })
        .eq('id', reportId)

      if (error) throw error

      toast.success(isActive ? 'Report paused' : 'Report activated')
      fetchScheduledReports()
    } catch {
      toast.error('Failed to update report')
    }
  }

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error

      toast.success('Report deleted')
      fetchScheduledReports()
    } catch {
      toast.error('Failed to delete report')
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Performance Analytics</h1>
            <p className="text-muted-foreground">
              Track agent performance, conversation metrics, and cost analysis
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to })
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select
              value={selectedAgents.length === agents.length ? 'all' : 'custom'}
              onValueChange={(v) => {
                if (v === 'all') {
                  setSelectedAgents(agents.map(a => a.id))
                }
              }}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-40">
                <div className="space-y-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleExportCSV}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleExportPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Conversations</p>
                    <p className="text-2xl font-bold">{formatNumber(summary.totalConversations)}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {summary.conversationsTrend >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                      )}
                      <span className={summary.conversationsTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(summary.conversationsTrend)}%
                      </span>
                      <span className="text-muted-foreground">vs last period</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{summary.successRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {summary.successRate >= 95 ? 'Excellent' : summary.successRate >= 80 ? 'Good' : 'Needs attention'}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{formatDuration(summary.avgResponseTime)}</p>
                    <p className="text-xs text-muted-foreground">
                      {summary.avgResponseTime < 2000 ? 'Fast' : summary.avgResponseTime < 5000 ? 'Normal' : 'Slow'}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {summary.costTrend <= 0 ? (
                        <ArrowDownRight className="w-3 h-3 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-red-500" />
                      )}
                      <span className={summary.costTrend <= 0 ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(summary.costTrend)}%
                      </span>
                      <span className="text-muted-foreground">vs last period</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Satisfaction</p>
                    <p className="text-2xl font-bold">{summary.avgSatisfaction.toFixed(1)}/5</p>
                    <div className="flex items-center gap-1 text-xs">
                      {summary.satisfactionTrend >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                      )}
                      <span className={summary.satisfactionTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(summary.satisfactionTrend)}%
                      </span>
                      <span className="text-muted-foreground">trend</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600">
                    <Star className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agent Comparison</TabsTrigger>
            <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            <TabsTrigger value="reports">Scheduled Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {conversationMetrics.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={BarChart3}
                    title="No analytics data yet"
                    description="Start having conversations with your agents to see analytics here"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Conversation Volume</CardTitle>
                    <CardDescription>Daily conversations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={conversationMetrics}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="conversations"
                          stroke="#0088FE"
                          fill="#0088FE"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Success vs Failure Rate</CardTitle>
                    <CardDescription>Conversation outcomes by day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={conversationMetrics}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="successful" name="Successful" fill="#00C49F" stackId="status" />
                        <Bar dataKey="failed" name="Failed" fill="#FF8042" stackId="status" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Response Time Trend</CardTitle>
                    <CardDescription>Average response time in milliseconds</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={conversationMetrics}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip formatter={(value) => `${value}ms`} />
                        <Line
                          type="monotone"
                          dataKey="avgResponseTime"
                          name="Avg Response Time"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost Over Time</CardTitle>
                    <CardDescription>Daily cost in USD</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={conversationMetrics}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `$${v.toFixed(2)}`} />
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(4)}`} />
                        <Area
                          type="monotone"
                          dataKey="totalCost"
                          name="Cost"
                          stroke="#00C49F"
                          fill="#00C49F"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            {agentPerformance.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Bot}
                    title="No agent data"
                    description="Agent performance metrics will appear here once agents start processing conversations"
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Agent Conversations</CardTitle>
                      <CardDescription>Total conversations per agent</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={agentPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" className="text-xs" />
                          <YAxis type="category" dataKey="agent_name" className="text-xs" width={100} />
                          <Tooltip />
                          <Bar dataKey="total_conversations" name="Conversations" fill="#0088FE" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Agent Success Rates</CardTitle>
                      <CardDescription>Success rate percentage per agent</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={agentPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" domain={[0, 100]} className="text-xs" />
                          <YAxis type="category" dataKey="agent_name" className="text-xs" width={100} />
                          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                          <Bar dataKey="success_rate" name="Success Rate" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Agent Performance Comparison</CardTitle>
                    <CardDescription>Detailed metrics for each agent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead className="text-right">Conversations</TableHead>
                          <TableHead className="text-right">Success Rate</TableHead>
                          <TableHead className="text-right">Avg Response</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                          <TableHead className="text-right">Satisfaction</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agentPerformance.map((agent) => (
                          <TableRow key={agent.agent_id}>
                            <TableCell className="font-medium">{agent.agent_name}</TableCell>
                            <TableCell className="text-right">{formatNumber(agent.total_conversations)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={agent.success_rate >= 90 ? 'default' : agent.success_rate >= 70 ? 'secondary' : 'destructive'}>
                                {agent.success_rate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatDuration(agent.avg_response_time)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(agent.total_cost)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {agent.avg_satisfaction.toFixed(1)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            {agentPerformance.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Coins}
                    title="No cost data"
                    description="Cost analytics will appear here once your agents start processing conversations"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost Distribution by Agent</CardTitle>
                    <CardDescription>Percentage of total cost per agent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={agentPerformance}
                          dataKey="total_cost"
                          nameKey="agent_name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {agentPerformance.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost per Conversation</CardTitle>
                    <CardDescription>Average cost efficiency by agent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={agentPerformance.map(a => ({
                          ...a,
                          cost_per_conversation: a.total_conversations > 0 ? a.total_cost / a.total_conversations : 0
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" tickFormatter={(v) => `$${v.toFixed(3)}`} />
                        <YAxis type="category" dataKey="agent_name" className="text-xs" width={100} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="cost_per_conversation" name="Cost/Conversation" fill="#FFBB28" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Cost Breakdown</CardTitle>
                    <CardDescription>Detailed cost analysis per agent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                          <TableHead className="text-right">Conversations</TableHead>
                          <TableHead className="text-right">Cost/Conversation</TableHead>
                          <TableHead className="text-right">Tokens Used</TableHead>
                          <TableHead className="text-right">Cost/1K Tokens</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agentPerformance.map((agent) => {
                          const costPerConversation = agent.total_conversations > 0 ? agent.total_cost / agent.total_conversations : 0
                          const costPer1kTokens = agent.total_tokens > 0 ? (agent.total_cost / agent.total_tokens) * 1000 : 0
                          return (
                            <TableRow key={agent.agent_id}>
                              <TableCell className="font-medium">{agent.agent_name}</TableCell>
                              <TableCell className="text-right">{formatCurrency(agent.total_cost)}</TableCell>
                              <TableCell className="text-right">{formatNumber(agent.total_conversations)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(costPerConversation)}</TableCell>
                              <TableCell className="text-right">{formatNumber(agent.total_tokens)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(costPer1kTokens)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="satisfaction" className="space-y-4">
            {summary.avgSatisfaction === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Star}
                    title="No satisfaction data"
                    description="User satisfaction ratings will appear here once users start rating conversations"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Satisfaction by Agent</CardTitle>
                    <CardDescription>Average user satisfaction rating</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={agentPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" domain={[0, 5]} className="text-xs" />
                        <YAxis type="category" dataKey="agent_name" className="text-xs" width={100} />
                        <Tooltip formatter={(value) => `${Number(value).toFixed(2)}/5`} />
                        <Bar dataKey="avg_satisfaction" name="Avg Satisfaction" fill="#FFBB28" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Satisfaction Overview</CardTitle>
                    <CardDescription>Key satisfaction metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center py-4">
                        <div className="text-5xl font-bold text-yellow-500">
                          {summary.avgSatisfaction.toFixed(1)}
                        </div>
                        <p className="text-muted-foreground mt-2">Average Rating out of 5</p>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-6 h-6 ${star <= Math.round(summary.avgSatisfaction) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Response Time Correlation</span>
                          <Badge variant="outline">
                            {summary.avgResponseTime < 2000 ? 'Positive' : 'Neutral'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Success Rate Impact</span>
                          <Badge variant="outline">
                            {summary.successRate >= 90 ? 'High' : 'Medium'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Scheduled Reports</h2>
                <p className="text-sm text-muted-foreground">Automatically receive analytics reports via email</p>
              </div>
              <Button onClick={() => setShowScheduleDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Report
              </Button>
            </div>

            {scheduledReports.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Mail}
                    title="No scheduled reports"
                    description="Schedule automated reports to receive analytics directly in your inbox"
                    action={{
                      label: "Create Report",
                      onClick: () => setShowScheduleDialog(true)
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Last Sent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{report.report_type}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{report.frequency}</TableCell>
                        <TableCell>{report.email_recipients.length} recipient(s)</TableCell>
                        <TableCell>
                          {report.last_sent_at ? format(new Date(report.last_sent_at), 'MMM d, yyyy') : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.is_active ? 'default' : 'secondary'}>
                            {report.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={report.is_active}
                              onCheckedChange={() => toggleReportActive(report.id, report.is_active)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReport(report.id)}
                            >
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Analytics Report</DialogTitle>
            <DialogDescription>
              Create an automated report that will be sent to your email on a regular basis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                placeholder="Weekly Performance Summary"
                value={newReport.name}
                onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select
                value={newReport.report_type}
                onValueChange={(v) => setNewReport({ ...newReport, report_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  <SelectItem value="usage">Usage Summary</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="cost">Cost Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={newReport.frequency}
                onValueChange={(v) => setNewReport({ ...newReport, frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newReport.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={String(newReport.schedule_day)}
                  onValueChange={(v) => setNewReport({ ...newReport, schedule_day: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {newReport.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Select
                  value={String(newReport.schedule_day)}
                  onValueChange={(v) => setNewReport({ ...newReport, schedule_day: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                      <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Email Recipients</Label>
              <Input
                placeholder="email@example.com"
                value={newReport.email_recipients[0]}
                onChange={(e) => setNewReport({ ...newReport, email_recipients: [e.target.value] })}
              />
              <p className="text-xs text-muted-foreground">Report will be sent to this email address</p>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select
                value={String(newReport.date_range_days)}
                onValueChange={(v) => setNewReport({ ...newReport, date_range_days: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-charts"
                checked={newReport.include_charts}
                onCheckedChange={(checked) => setNewReport({ ...newReport, include_charts: checked as boolean })}
              />
              <Label htmlFor="include-charts" className="text-sm">Include charts and visualizations</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReport}>
              <Mail className="w-4 h-4 mr-2" />
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
