'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Bell,
  ChevronDown,
  ChevronUp,
  Hexagon,
  Server,
  Database,
  Shield,
  Zap,
  Radio,
  HardDrive,
  ExternalLink,
  Loader2,
  Mail,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface SystemService {
  id: string
  name: string
  slug: string
  description: string
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance'
  uptime_percentage: number
  last_checked_at: string
  order_index: number
}

interface SystemIncident {
  id: string
  title: string
  description: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  severity: 'minor' | 'major' | 'critical'
  affected_services: string[]
  started_at: string
  resolved_at: string | null
  updates?: IncidentUpdate[]
}

interface IncidentUpdate {
  id: string
  status: string
  message: string
  created_at: string
}

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  api: Server,
  database: Database,
  auth: Shield,
  'edge-functions': Zap,
  realtime: Radio,
  storage: HardDrive,
}

const statusConfig = {
  operational: {
    label: 'Operational',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    icon: CheckCircle2,
  },
  degraded: {
    label: 'Degraded',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: AlertTriangle,
  },
  partial_outage: {
    label: 'Partial Outage',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    icon: AlertTriangle,
  },
  major_outage: {
    label: 'Major Outage',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: XCircle,
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: Clock,
  },
}

const incidentStatusConfig = {
  investigating: { label: 'Investigating', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  identified: { label: 'Identified', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  monitoring: { label: 'Monitoring', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  resolved: { label: 'Resolved', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
}

const severityConfig = {
  minor: { label: 'Minor', color: 'text-amber-500' },
  major: { label: 'Major', color: 'text-orange-500' },
  critical: { label: 'Critical', color: 'text-red-500' },
}

export default function StatusPage() {
  const [services, setServices] = useState<SystemService[]>([])
  const [incidents, setIncidents] = useState<SystemIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [expandedIncidents, setExpandedIncidents] = useState<Set<string>>(new Set())
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchStatus = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true)

    try {
      const [servicesResult, incidentsResult] = await Promise.all([
        supabase
          .from('system_services')
          .select('*')
          .order('order_index'),
        supabase
          .from('system_incidents')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(10),
      ])

      if (servicesResult.data) {
        setServices(servicesResult.data)
      }

      if (incidentsResult.data) {
        const incidentsWithUpdates = await Promise.all(
          incidentsResult.data.map(async (incident) => {
            const { data: updates } = await supabase
              .from('incident_updates')
              .select('*')
              .eq('incident_id', incident.id)
              .order('created_at', { ascending: false })

            return { ...incident, updates: updates || [] }
          })
        )
        setIncidents(incidentsWithUpdates)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch status:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => fetchStatus(), 60000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscribeEmail) return

    setSubscribing(true)
    try {
      const { error } = await supabase
        .from('status_subscribers')
        .insert({ email: subscribeEmail })

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already subscribed',
            description: 'This email is already subscribed to status updates.',
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: 'Subscribed successfully',
          description: 'You will receive email notifications for status updates.',
        })
        setSubscribeEmail('')
        setSubscribeDialogOpen(false)
      }
    } catch (error) {
      toast({
        title: 'Subscription failed',
        description: 'Failed to subscribe. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubscribing(false)
    }
  }

  const toggleIncident = (id: string) => {
    setExpandedIncidents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const overallStatus = services.length > 0
    ? services.every((s) => s.status === 'operational')
      ? 'operational'
      : services.some((s) => s.status === 'major_outage')
        ? 'major_outage'
        : services.some((s) => s.status === 'partial_outage')
          ? 'partial_outage'
          : services.some((s) => s.status === 'maintenance')
            ? 'maintenance'
            : 'degraded'
    : 'operational'

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved')
  const pastIncidents = incidents.filter((i) => i.status === 'resolved')

  const averageUptime = services.length > 0
    ? (services.reduce((acc, s) => acc + Number(s.uptime_percentage), 0) / services.length).toFixed(2)
    : '99.99'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const StatusIcon = statusConfig[overallStatus].icon

  return (
    <main className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Hexagon className="h-6 w-6 text-primary fill-primary/20" />
            <span className="font-bold">HIVE Status</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchStatus(true)}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={subscribeDialogOpen} onOpenChange={setSubscribeDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Bell className="w-4 h-4" />
                  Subscribe
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Subscribe to Status Updates</DialogTitle>
                  <DialogDescription>
                    Receive email notifications when there are status changes or incidents.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubscribe}>
                  <div className="py-4">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setSubscribeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={subscribing} className="gap-2">
                      {subscribing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      Subscribe
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`mb-8 ${statusConfig[overallStatus].borderColor} border-2`}>
            <CardContent className="py-8">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl ${statusConfig[overallStatus].bgColor} flex items-center justify-center`}>
                  <StatusIcon className={`w-8 h-8 ${statusConfig[overallStatus].color}`} />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h1 className={`text-2xl font-bold ${statusConfig[overallStatus].color}`}>
                    {overallStatus === 'operational'
                      ? 'All Systems Operational'
                      : overallStatus === 'maintenance'
                        ? 'Scheduled Maintenance'
                        : 'System Issues Detected'}
                  </h1>
                  <p className="text-muted-foreground">
                    Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-3xl font-bold">{averageUptime}%</p>
                  <p className="text-sm text-muted-foreground">Uptime (30 days)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {activeIncidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold mb-4">Active Incidents</h2>
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <Card key={incident.id} className="border-amber-500/30">
                  <Collapsible
                    open={expandedIncidents.has(incident.id)}
                    onOpenChange={() => toggleIncident(incident.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`${incidentStatusConfig[incident.status].bgColor} ${incidentStatusConfig[incident.status].color} border-0`}>
                                {incidentStatusConfig[incident.status].label}
                              </Badge>
                              <Badge variant="outline" className={severityConfig[incident.severity].color}>
                                {severityConfig[incident.severity].label}
                              </Badge>
                            </div>
                            <CardTitle className="text-base">{incident.title}</CardTitle>
                            <CardDescription className="mt-1">
                              Started {format(new Date(incident.started_at), 'MMM d, yyyy h:mm a')}
                            </CardDescription>
                          </div>
                          {expandedIncidents.has(incident.id) ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-4">{incident.description}</p>
                        {incident.updates && incident.updates.length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium mb-3">Updates</h4>
                            <div className="space-y-3">
                              {incident.updates.map((update) => (
                                <div key={update.id} className="flex gap-3">
                                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                                  <div>
                                    <p className="text-sm">{update.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(update.created_at), 'MMM d, h:mm a')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">Service Status</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {services.map((service) => {
                const Icon = serviceIcons[service.slug] || Server
                const config = statusConfig[service.status]
                const ServiceStatusIcon = config.icon

                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{Number(service.uptime_percentage).toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">uptime</p>
                      </div>
                      <div className={`flex items-center gap-2 ${config.color}`}>
                        <ServiceStatusIcon className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:inline">{config.label}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">Uptime History (30 days)</h2>
          <Card>
            <CardContent className="py-6">
              <div className="flex gap-0.5 h-8">
                {Array.from({ length: 30 }).map((_, i) => {
                  const isToday = i === 29
                  const hasIncident = i === 26 || i === 22
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${
                        hasIncident
                          ? 'bg-amber-500/80'
                          : isToday
                            ? 'bg-emerald-500'
                            : 'bg-emerald-500/60'
                      }`}
                      title={`${30 - i} days ago${hasIncident ? ' - Minor incident' : ''}`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="text-muted-foreground">No issues</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-amber-500" />
                  <span className="text-muted-foreground">Minor issue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-red-500" />
                  <span className="text-muted-foreground">Major issue</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {pastIncidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold mb-4">Past Incidents</h2>
            <div className="space-y-4">
              {pastIncidents.map((incident) => (
                <Card key={incident.id}>
                  <Collapsible
                    open={expandedIncidents.has(incident.id)}
                    onOpenChange={() => toggleIncident(incident.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-0">
                                Resolved
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(incident.started_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <CardTitle className="text-base">{incident.title}</CardTitle>
                          </div>
                          {expandedIncidents.has(incident.id) ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                        {incident.resolved_at && (
                          <p className="text-xs text-muted-foreground">
                            Resolved {format(new Date(incident.resolved_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-muted/30">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Stay Informed</p>
                  <p className="text-sm text-muted-foreground">
                    Subscribe to get notified about status changes and scheduled maintenance.
                  </p>
                </div>
                <Button onClick={() => setSubscribeDialogOpen(true)} className="gap-2 shrink-0">
                  <Mail className="w-4 h-4" />
                  Subscribe to Updates
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <footer className="mt-12 pt-8 border-t text-center">
          <Link href="/" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Hexagon className="h-5 w-5 text-primary fill-primary/20" />
            <span className="font-semibold">HIVE Protocol</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Status page powered by HIVE
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact Support
            </Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
