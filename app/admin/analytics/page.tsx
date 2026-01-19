'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Users,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  Download,
  Calendar,
  Hexagon,
  Bot,
  Activity,
  PieChart,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  useAdminAnalytics,
  type OverviewStats,
  type MessageDataPoint,
  type UserGrowthDataPoint,
  type ActiveUsersStats,
  type FrameworkUsage,
  type TopSwarm,
  type PlanDistribution,
  type ActivityTimelinePoint,
} from '@/hooks/use-admin-analytics'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function StatCard({ title, value, icon: Icon, description, loading, trend }: {
  title: string
  value: number | string
  icon: React.ElementType
  description?: string
  loading: boolean
  trend?: { value: number; positive: boolean }
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-20 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              )}
              <p className="text-sm text-muted-foreground">{title}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          {trend && !loading && (
            <Badge className={trend.positive ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/20 text-red-600'}>
              {trend.positive ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminAnalyticsPage() {
  const {
    getOverview,
    getMessagesOverTime,
    getUserGrowth,
    getActiveUsers,
    getFrameworkUsage,
    getTopSwarms,
    getPlanDistribution,
    getActivityTimeline,
    exportAnalytics,
  } = useAdminAnalytics()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [messages, setMessages] = useState<MessageDataPoint[]>([])
  const [userGrowth, setUserGrowth] = useState<UserGrowthDataPoint[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUsersStats | null>(null)
  const [frameworkUsage, setFrameworkUsage] = useState<FrameworkUsage[]>([])
  const [topSwarms, setTopSwarms] = useState<TopSwarm[]>([])
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([])
  const [activityTimeline, setActivityTimeline] = useState<ActivityTimelinePoint[]>([])
  const [exporting, setExporting] = useState(false)

  const loadData = useCallback(async (selectedPeriod: string = period) => {
    try {
      setLoading(true)
      const [
        overviewData,
        messagesData,
        userGrowthData,
        activeUsersData,
        frameworkData,
        topSwarmsData,
        planData,
        timelineData,
      ] = await Promise.all([
        getOverview(),
        getMessagesOverTime(selectedPeriod),
        getUserGrowth(selectedPeriod),
        getActiveUsers(),
        getFrameworkUsage(),
        getTopSwarms(10),
        getPlanDistribution(),
        getActivityTimeline(selectedPeriod),
      ])

      setOverview(overviewData)
      setMessages(messagesData)
      setUserGrowth(userGrowthData)
      setActiveUsers(activeUsersData)
      setFrameworkUsage(frameworkData)
      setTopSwarms(topSwarmsData)
      setPlanDistribution(planData)
      setActivityTimeline(timelineData)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load analytics data',
      })
    } finally {
      setLoading(false)
    }
  }, [
    period,
    getOverview,
    getMessagesOverTime,
    getUserGrowth,
    getActiveUsers,
    getFrameworkUsage,
    getTopSwarms,
    getPlanDistribution,
    getActivityTimeline,
    toast,
  ])

  useEffect(() => {
    loadData()
  }, [])

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    loadData(newPeriod)
  }

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setExporting(true)
      await exportAnalytics(format)
      toast({ title: `Analytics exported as ${format.toUpperCase()}` })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to export analytics',
      })
    } finally {
      setExporting(false)
    }
  }

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">Monitor platform performance and user activity</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => loadData()} variant="outline" size="icon" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={overview?.total_users || 0}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Total Messages"
          value={overview?.total_messages || 0}
          icon={MessageSquare}
          description={`${overview?.messages_today || 0} today`}
          loading={loading}
        />
        <StatCard
          title="Total Swarms"
          value={overview?.total_swarms || 0}
          icon={Hexagon}
          loading={loading}
        />
        <StatCard
          title="Total Agents"
          value={overview?.total_agents || 0}
          icon={Bot}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Daily Active Users</span>
              <Badge variant="outline">{activeUsers?.dau_percentage || 0}%</Badge>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{activeUsers?.dau || 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Weekly Active Users</span>
              <Badge variant="outline">{activeUsers?.wau_percentage || 0}%</Badge>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{activeUsers?.wau || 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Monthly Active Users</span>
              <Badge variant="outline">{activeUsers?.mau_percentage || 0}%</Badge>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{activeUsers?.mau || 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messages Over Time
            </CardTitle>
            <CardDescription>Daily message volume</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={messages}>
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorMessages)"
                    name="Messages"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              User Growth
            </CardTitle>
            <CardDescription>New users and total user count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="new_users"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="New Users"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total_users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Total Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Framework Usage
            </CardTitle>
            <CardDescription>Agent frameworks distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={frameworkUsage}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="framework"
                    label={({ framework, percentage }) => `${framework} (${percentage}%)`}
                    labelLine={false}
                  >
                    {frameworkUsage.map((entry, index) => (
                      <Cell key={entry.framework} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Plan Distribution
            </CardTitle>
            <CardDescription>User subscription breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={planDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="plan" type="category" className="text-xs capitalize" width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="count" name="Users" radius={[0, 4, 4, 0]}>
                    {planDistribution.map((entry, index) => (
                      <Cell
                        key={entry.plan}
                        fill={entry.plan === 'enterprise' ? '#f59e0b' : entry.plan === 'pro' ? '#3b82f6' : '#6b7280'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity Breakdown
            </CardTitle>
            <CardDescription>Recent platform activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">Messages this week</span>
                  </div>
                  <span className="font-semibold">{overview?.messages_this_week.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm">Active users (MAU)</span>
                  </div>
                  <span className="font-semibold">{activeUsers?.mau}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Hexagon className="w-5 h-5 text-amber-500" />
                    <span className="text-sm">Total swarms</span>
                  </div>
                  <span className="font-semibold">{overview?.total_swarms}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-purple-500" />
                    <span className="text-sm">Total agents</span>
                  </div>
                  <span className="font-semibold">{overview?.total_agents}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>Daily breakdown of platform activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityTimeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={formatXAxis} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="messages" name="Messages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="swarms" name="Swarms" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="agents" name="Agents" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="users" name="Users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hexagon className="w-5 h-5" />
            Top Swarms by Activity
          </CardTitle>
          <CardDescription>Most active swarms on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topSwarms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No swarms found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Swarm</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Agents</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSwarms.map((swarm, index) => (
                  <TableRow key={swarm.id}>
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Hexagon className="w-4 h-4 text-primary" />
                        <span className="font-medium">{swarm.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{swarm.owner_name}</TableCell>
                    <TableCell className="text-right font-medium">{swarm.message_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{swarm.agent_count}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(swarm.last_activity), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
