'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Coins, TrendingUp, Zap, Bot, Users, Download, AlertTriangle,
  Clock, Activity, Loader2, ArrowUpRight, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { PageTransition } from '@/components/ui/page-transition'
import { EmptyState } from '@/components/ui/empty-state'
import {
  UsageTrendChart,
  ModelUsageChart,
  AgentUsageChart,
  TokenBreakdownChart,
  CostEstimateTable,
} from '@/components/dashboard/usage-charts'
import { useDetailedUsage, type DateRange } from '@/hooks/use-detailed-usage'
import { toast } from 'sonner'
import Link from 'next/link'

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

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'sky',
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; label: string }
  color?: 'sky' | 'green' | 'amber' | 'red' | 'violet'
}) {
  const colorClasses = {
    sky: 'bg-sky-500/10 text-sky-600',
    green: 'bg-green-500/10 text-green-600',
    amber: 'bg-amber-500/10 text-amber-600',
    red: 'bg-red-500/10 text-red-600',
    violet: 'bg-violet-500/10 text-violet-600',
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <ArrowUpRight
                  className={`w-3 h-3 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`}
                />
                <span className={trend.value >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UsageLimitCard({
  title,
  current,
  limit,
  icon: Icon,
  showWarning,
}: {
  title: string
  current: number
  limit: number
  icon: React.ElementType
  showWarning: boolean
}) {
  const percentage = Math.min(100, (current / limit) * 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatNumber(current)} / {formatNumber(limit)}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showWarning && isNearLimit && !isAtLimit && (
        <p className="text-xs text-amber-600">Approaching limit ({percentage.toFixed(0)}%)</p>
      )}
      {showWarning && isAtLimit && (
        <p className="text-xs text-red-600">Limit reached</p>
      )}
    </div>
  )
}

export default function UsageDashboardPage() {
  const {
    loading,
    error,
    dateRange,
    setDateRange,
    dailyUsage,
    usageByModel,
    usageByAgent,
    summary,
    planLimits,
    currentUsage,
    fetchDetailedUsage,
    downloadCSV,
    isApproachingLimit,
    modelCosts,
  } = useDetailedUsage()

  const [chartMetric, setChartMetric] = useState<'tokens' | 'cost' | 'requests'>('tokens')

  useEffect(() => {
    fetchDetailedUsage()
  }, [fetchDetailedUsage])

  const handleDateRangeChange = (value: string) => {
    setDateRange(value as DateRange)
    fetchDetailedUsage(value as DateRange)
  }

  const handleExport = () => {
    downloadCSV()
    toast.success('Usage data exported')
  }

  const showUpgradePrompt =
    planLimits &&
    currentUsage &&
    (isApproachingLimit('tokens', 80) ||
      isApproachingLimit('requests', 80) ||
      isApproachingLimit('agents', 80))

  if (loading && !summary) {
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
            <h1 className="text-2xl font-bold">AI Usage</h1>
            <p className="text-muted-foreground">
              Monitor your AI consumption, costs, and trends
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {showUpgradePrompt && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-600">Approaching Usage Limits</AlertTitle>
            <AlertDescription className="text-amber-600/80">
              You&apos;re approaching your plan limits. Consider upgrading to continue using AI
              features without interruption.
              <Link href="/pricing" className="ml-2 font-medium underline underline-offset-4">
                View Plans
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <StatCard
              title="Total Tokens"
              value={formatNumber(summary?.total_tokens || 0)}
              subtitle={`${formatNumber(summary?.total_input_tokens || 0)} in / ${formatNumber(summary?.total_output_tokens || 0)} out`}
              icon={Activity}
              color="sky"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              title="Estimated Cost"
              value={formatCurrency(summary?.total_cost || 0)}
              subtitle={`${dateRange === '7d' ? 'This week' : dateRange === '30d' ? 'This month' : dateRange === '90d' ? 'Last 90 days' : 'All time'}`}
              icon={Coins}
              color="green"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard
              title="API Requests"
              value={formatNumber(summary?.total_requests || 0)}
              subtitle={`${summary?.unique_models || 0} models used`}
              icon={Zap}
              color="amber"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatCard
              title="Avg Latency"
              value={`${((summary?.avg_latency || 0) / 1000).toFixed(2)}s`}
              subtitle={`${summary?.unique_agents || 0} agents active`}
              icon={Clock}
              color="violet"
            />
          </motion.div>
        </div>

        {planLimits && currentUsage && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Current Plan Limits</CardTitle>
                  <CardDescription>
                    Your daily usage against{' '}
                    <Badge variant="outline" className="capitalize ml-1">
                      {planLimits.plan}
                    </Badge>{' '}
                    plan limits
                  </CardDescription>
                </div>
                <Link href="/pricing">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Upgrade
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <UsageLimitCard
                  title="Tokens Today"
                  current={currentUsage.tokens_today}
                  limit={planLimits.tokens_per_day}
                  icon={Activity}
                  showWarning={true}
                />
                <UsageLimitCard
                  title="Requests Today"
                  current={currentUsage.requests_today}
                  limit={planLimits.requests_per_day}
                  icon={Zap}
                  showWarning={true}
                />
                <UsageLimitCard
                  title="Messages Today"
                  current={currentUsage.messages_today}
                  limit={planLimits.messages_per_day}
                  icon={BarChart3}
                  showWarning={true}
                />
                <UsageLimitCard
                  title="Total Agents"
                  current={currentUsage.agents_count}
                  limit={planLimits.max_agents}
                  icon={Bot}
                  showWarning={true}
                />
                <UsageLimitCard
                  title="Total Swarms"
                  current={currentUsage.swarms_count}
                  limit={planLimits.max_swarms}
                  icon={Users}
                  showWarning={true}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="trends" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="models">By Model</TabsTrigger>
              <TabsTrigger value="agents">By Agent</TabsTrigger>
              <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
            </TabsList>
            <Select
              value={chartMetric}
              onValueChange={(v) => setChartMetric(v as 'tokens' | 'cost' | 'requests')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tokens">Tokens</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
                <SelectItem value="requests">Requests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="trends" className="space-y-4">
            {dailyUsage.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={TrendingUp}
                    title="No usage data yet"
                    description="Start using AI features to see your usage trends here"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <UsageTrendChart data={dailyUsage} metric={chartMetric} />
                </div>
                <TokenBreakdownChart
                  inputTokens={summary?.total_input_tokens || 0}
                  outputTokens={summary?.total_output_tokens || 0}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            {usageByModel.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={BarChart3}
                    title="No model usage data"
                    description="Usage by model will appear here once you start making AI requests"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ModelUsageChart data={usageByModel} metric={chartMetric} />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Model Performance</CardTitle>
                    <CardDescription>Latency and request statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {usageByModel.slice(0, 5).map((model) => (
                        <div key={model.model} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{model.model}</p>
                            <p className="text-xs text-muted-foreground">
                              {model.provider} - {model.total_requests} requests
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {(model.avg_latency / 1000).toFixed(2)}s
                            </p>
                            <p className="text-xs text-muted-foreground">avg latency</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            {usageByAgent.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Bot}
                    title="No agent usage data"
                    description="Usage by agent will appear here once your agents start making AI requests"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AgentUsageChart data={usageByAgent} metric={chartMetric} />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Agents</CardTitle>
                    <CardDescription>Ranked by {chartMetric}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {usageByAgent.slice(0, 5).map((agent, index) => (
                        <div key={agent.agent_id} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{agent.agent_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {agent.total_requests} requests
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {chartMetric === 'cost'
                                ? formatCurrency(agent.total_cost)
                                : chartMetric === 'tokens'
                                  ? formatNumber(agent.total_tokens)
                                  : agent.total_requests}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            {usageByModel.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Coins}
                    title="No cost data"
                    description="Cost analysis will appear here once you start using AI models"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CostEstimateTable data={usageByModel} modelCosts={modelCosts} />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cost Breakdown</CardTitle>
                    <CardDescription>Estimated costs by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Input Tokens</span>
                          <span className="font-medium">
                            {formatCurrency((summary?.total_cost || 0) * 0.4)}
                          </span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="h-full bg-primary transition-all" style={{ width: '40%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Output Tokens</span>
                          <span className="font-medium">
                            {formatCurrency((summary?.total_cost || 0) * 0.6)}
                          </span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="h-full bg-green-500 transition-all" style={{ width: '60%' }} />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Estimated Cost</span>
                        <span className="text-xl font-bold">
                          {formatCurrency(summary?.total_cost || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cost estimates are based on standard API pricing. Actual costs may vary based
                        on your specific agreements and usage patterns.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}
