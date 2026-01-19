'use client'

export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
import { Users, Hexagon, MessageSquare, DollarSign, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { useAdminStats, formatNumber, formatCurrency, formatRelativeTime } from '@/hooks/use-admin-stats'

const PLAN_COLORS: Record<string, string> = {
  free: '#6B7280',
  pro: '#3B82F6',
  enterprise: '#F5A623',
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-12 h-5" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="w-20 h-8" />
          <Skeleton className="w-24 h-4" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <Skeleton className="w-full h-full" />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-40 h-4" />
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-8 h-4" />
          <Skeleton className="w-24 h-4" />
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminStats()

  const stats = data?.stats ? [
    { label: 'Total Users', value: formatNumber(data.stats.total_users), trend: data.stats.user_trend, icon: Users },
    { label: 'Active Swarms', value: formatNumber(data.stats.active_swarms), trend: data.stats.swarm_trend, icon: Hexagon },
    { label: 'Messages/Day', value: formatNumber(data.stats.messages_today), trend: data.stats.message_trend, icon: MessageSquare },
    { label: 'MRR', value: formatCurrency(data.stats.mrr), trend: data.stats.mrr_trend, icon: DollarSign },
  ] : []

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and analytics</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${stat.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stat.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{Math.abs(stat.trend)}%</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.userGrowth || []}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Framework Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data?.frameworkUsage && data.frameworkUsage.length > 0 ? (
              <>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.frameworkUsage}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.frameworkUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={(entry as { color?: string }).color || '#6B7280'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value}%`, 'Usage']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {data.frameworkUsage.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (item as { color?: string }).color || '#6B7280' }} />
                      <span className="text-sm text-muted-foreground">{item.name} ({item.count})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No framework data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Messages (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.dailyMessages || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) => new Date(value).getDate().toString()}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data?.planDistribution && data.planDistribution.length > 0 ? (
              <div className="space-y-4">
                {data.planDistribution.map((plan) => (
                  <div key={plan.plan} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{plan.plan}</span>
                      <span className="text-muted-foreground">{plan.count} users ({plan.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${plan.percentage}%`,
                          backgroundColor: PLAN_COLORS[plan.plan] || '#6B7280',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No plan data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Signups</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : data?.recentSignups && data.recentSignups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Agents</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSignups.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                              {user.name[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          user.plan === 'enterprise' ? 'bg-amber-500/20 text-amber-600' :
                          user.plan === 'pro' ? 'bg-blue-500/20 text-blue-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="py-3 px-4">{user.agents}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatRelativeTime(user.joined)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No users yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
