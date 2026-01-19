'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldQuestion,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileKey,
  Lock,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface VerificationStats {
  total_messages: number
  signed_messages: number
  verified_messages: number
  tampered_messages: number
  invalid_messages: number
  unsigned_messages: number
  verification_rate: number
  tamper_rate: number
}

interface SwarmVerificationStats {
  id: string
  name: string
  total_messages: number
  verified: number
  tampered: number
  verification_enabled: boolean
}

interface RecentTamperedMessage {
  id: string
  swarm_id: string
  swarm_name: string
  content_preview: string
  created_at: string
  verification_error: string | null
}

const STATUS_COLORS = {
  verified: '#10b981',
  signed: '#3b82f6',
  tampered: '#ef4444',
  invalid: '#f59e0b',
  unsigned: '#6b7280',
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

export default function AdminSecurityPage() {
  const [stats, setStats] = useState<VerificationStats | null>(null)
  const [swarmStats, setSwarmStats] = useState<SwarmVerificationStats[]>([])
  const [recentTampered, setRecentTampered] = useState<RecentTamperedMessage[]>([])
  const [dailyStats, setDailyStats] = useState<{ date: string; verified: number; tampered: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, signature_status, verified, created_at, swarm_id, verification_error, content')
        .eq('sender_type', 'agent')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (messagesError) throw messagesError

      const totalMessages = messages?.length || 0
      const verified = messages?.filter(m => m.signature_status === 'verified' || m.verified).length || 0
      const signed = messages?.filter(m => m.signature_status === 'signed').length || 0
      const tampered = messages?.filter(m => m.signature_status === 'tampered').length || 0
      const invalid = messages?.filter(m => m.signature_status === 'invalid').length || 0
      const unsigned = totalMessages - verified - signed - tampered - invalid

      setStats({
        total_messages: totalMessages,
        signed_messages: signed,
        verified_messages: verified,
        tampered_messages: tampered,
        invalid_messages: invalid,
        unsigned_messages: unsigned,
        verification_rate: totalMessages > 0 ? Math.round((verified / totalMessages) * 100) : 0,
        tamper_rate: totalMessages > 0 ? Math.round((tampered / totalMessages) * 100) : 0,
      })

      const tamperedMessages = messages?.filter(m => m.signature_status === 'tampered') || []
      const swarmIds = Array.from(new Set(tamperedMessages.map(m => m.swarm_id)))

      if (swarmIds.length > 0) {
        const { data: swarms } = await supabase
          .from('swarms')
          .select('id, name')
          .in('id', swarmIds)

        const swarmMap = new Map(swarms?.map(s => [s.id, s.name]) || [])
        setRecentTampered(
          tamperedMessages.slice(0, 10).map(m => ({
            id: m.id,
            swarm_id: m.swarm_id,
            swarm_name: swarmMap.get(m.swarm_id) || 'Unknown Swarm',
            content_preview: m.content?.substring(0, 100) || '',
            created_at: m.created_at,
            verification_error: m.verification_error,
          }))
        )
      }

      const { data: swarms } = await supabase
        .from('swarms')
        .select('id, name, settings')
        .limit(20)

      if (swarms) {
        const swarmVerificationStats: SwarmVerificationStats[] = []
        for (const swarm of swarms) {
          const swarmMessages = messages?.filter(m => m.swarm_id === swarm.id) || []
          const settings = swarm.settings as Record<string, unknown> | null
          const verification = settings?.verification as { enabled?: boolean } | undefined
          swarmVerificationStats.push({
            id: swarm.id,
            name: swarm.name,
            total_messages: swarmMessages.length,
            verified: swarmMessages.filter(m => m.signature_status === 'verified' || m.verified).length,
            tampered: swarmMessages.filter(m => m.signature_status === 'tampered').length,
            verification_enabled: verification?.enabled !== false,
          })
        }
        setSwarmStats(swarmVerificationStats.filter(s => s.total_messages > 0).slice(0, 10))
      }

      const last7Days: { date: string; verified: number; tampered: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const dayMessages = messages?.filter(m => m.created_at.startsWith(dateStr)) || []
        last7Days.push({
          date: dateStr,
          verified: dayMessages.filter(m => m.signature_status === 'verified' || m.verified).length,
          tampered: dayMessages.filter(m => m.signature_status === 'tampered').length,
        })
      }
      setDailyStats(last7Days)
    } catch (err) {
      console.error('Error fetching security stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch security stats')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const pieData = stats
    ? [
        { name: 'Verified', value: stats.verified_messages, color: STATUS_COLORS.verified },
        { name: 'Signed', value: stats.signed_messages, color: STATUS_COLORS.signed },
        { name: 'Tampered', value: stats.tampered_messages, color: STATUS_COLORS.tampered },
        { name: 'Invalid', value: stats.invalid_messages, color: STATUS_COLORS.invalid },
        { name: 'Unsigned', value: stats.unsigned_messages, color: STATUS_COLORS.unsigned },
      ].filter(d => d.value > 0)
    : []

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Security Stats</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchStats} variant="outline">
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
          <h1 className="text-2xl font-bold">Security & Verification</h1>
          <p className="text-muted-foreground">Message signature verification statistics</p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Alert className="mb-6 bg-muted/50">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Message verification uses HMAC-SHA256 cryptographic signatures to ensure message integrity.
          All agent messages are automatically signed, and can be verified to confirm authenticity.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                      {stats?.verification_rate || 0}%
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stats?.verified_messages.toLocaleString() || 0}</p>
                    <p className="text-sm text-muted-foreground">Verified Messages</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileKey className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stats?.signed_messages.toLocaleString() || 0}</p>
                    <p className="text-sm text-muted-foreground">Signed (Pending Verification)</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className={stats?.tampered_messages ? 'ring-1 ring-red-500/30' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <ShieldX className="w-5 h-5 text-red-500" />
                    </div>
                    {(stats?.tampered_messages || 0) > 0 && (
                      <Badge variant="destructive">
                        {stats?.tamper_rate || 0}%
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stats?.tampered_messages.toLocaleString() || 0}</p>
                    <p className="text-sm text-muted-foreground">Tampered Messages</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stats?.total_messages.toLocaleString() || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Agent Messages</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Verification Distribution</CardTitle>
            <CardDescription>Breakdown of message verification statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : pieData.length > 0 ? (
              <>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [value.toLocaleString(), 'Messages']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No verification data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Verification Trends</CardTitle>
            <CardDescription>Verified vs tampered messages over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : dailyStats.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="verified" name="Verified" fill={STATUS_COLORS.verified} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tampered" name="Tampered" fill={STATUS_COLORS.tampered} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No daily data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Swarm Verification Status</CardTitle>
            <CardDescription>Verification rates per swarm</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : swarmStats.length > 0 ? (
              <div className="space-y-4">
                {swarmStats.map((swarm) => {
                  const verificationRate = swarm.total_messages > 0
                    ? Math.round((swarm.verified / swarm.total_messages) * 100)
                    : 0
                  return (
                    <div key={swarm.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {swarm.verification_enabled ? (
                                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <ShieldQuestion className="w-4 h-4 text-muted-foreground shrink-0" />
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                {swarm.verification_enabled ? 'Verification enabled' : 'Verification disabled'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="font-medium truncate">{swarm.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {swarm.tampered > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {swarm.tampered} tampered
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {swarm.verified}/{swarm.total_messages}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${verificationRate}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No swarm data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldX className="w-5 h-5 text-red-500" />
              Recent Tampered Messages
            </CardTitle>
            <CardDescription>Messages with failed signature verification</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentTampered.length > 0 ? (
              <div className="space-y-3">
                {recentTampered.map((msg) => (
                  <div key={msg.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{msg.swarm_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {msg.content_preview}...
                    </p>
                    {msg.verification_error && (
                      <p className="text-xs text-red-500 mt-1">{msg.verification_error}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No tampered messages detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All agent messages have passed integrity checks
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
