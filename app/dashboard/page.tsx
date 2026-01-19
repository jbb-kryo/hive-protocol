'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Hexagon, Bot, MessageSquare, Wrench, Plus, Zap, UserPlus, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DemoBanner } from '@/components/dashboard/demo-banner'
import { GuestBanner } from '@/components/dashboard/guest-banner'
import { StatCard } from '@/components/dashboard/stat-card'
import { SwarmCard } from '@/components/dashboard/swarm-card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { CreateSwarmDialog } from '@/components/dashboard/create-swarm-dialog'
import { BroadcastMessageDialog } from '@/components/dashboard/broadcast-message-dialog'
import { UsageCard } from '@/components/dashboard/usage-card'
import { SkeletonStats, SkeletonCard } from '@/components/ui/skeleton-card'
import { PageTransition } from '@/components/ui/page-transition'
import { useStore } from '@/store'
import { useDemo } from '@/hooks/use-demo'
import { useAgents } from '@/hooks/use-agents'
import { useSwarm } from '@/hooks/use-swarm'
import { useActivity } from '@/hooks/use-activity'
import { useStats } from '@/hooks/use-stats'
import { useUsage } from '@/hooks/use-usage'
import { getAgentColor } from '@/lib/demo-engine'

export default function DashboardPage() {
  const { isDemo, isGuest, agents, swarms } = useStore()
  const { initializeDemo } = useDemo()
  const { fetchAgents } = useAgents()
  const { fetchSwarms } = useSwarm()
  const { activities, isLoading: activitiesLoading } = useActivity(10)
  const { stats: dbStats, isLoading: statsLoading } = useStats()
  const { stats: usageStats, isLoading: usageLoading } = useUsage()
  const [createSwarmOpen, setCreateSwarmOpen] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [isLoadingSwarms, setIsLoadingSwarms] = useState(true)
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)
  const [demoInitialized, setDemoInitialized] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const demoParam = params.get('demo')

    if (demoParam === 'true' && !demoInitialized) {
      setDemoInitialized(true)
      initializeDemo().finally(() => {
        setIsLoadingAgents(false)
        setIsLoadingSwarms(false)
      })
    } else if (!isDemo) {
      setIsLoadingAgents(true)
      setIsLoadingSwarms(true)

      Promise.all([fetchAgents(), fetchSwarms()]).finally(() => {
        setIsLoadingAgents(false)
        setIsLoadingSwarms(false)
      })
    } else {
      setIsLoadingAgents(false)
      setIsLoadingSwarms(false)
    }
  }, [isDemo, demoInitialized, fetchAgents, fetchSwarms, initializeDemo])

  const stats = isDemo
    ? {
        activeSwarms: swarms.filter((s) => s.status === 'active').length,
        agents: agents.length,
        messagesToday: swarms.reduce((acc, s) => acc + (s.message_count || 0), 0),
        integrations: 0,
        trends: {},
      }
    : dbStats || {
        activeSwarms: 0,
        agents: 0,
        messagesToday: 0,
        integrations: 0,
        trends: {},
      }

  return (
    <PageTransition>
      <div className="p-4 lg:p-8">
        {isDemo && <DemoBanner />}
        {isGuest && <GuestBanner />}

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Agent Orchestration Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your AI agent swarms</p>
        </div>

        {statsLoading && !isDemo ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <StatCard
              label="Active Swarms"
              value={stats.activeSwarms}
              icon={Hexagon}
              trend={stats.trends.swarms}
            />
            <StatCard
              label="Connected Agents"
              value={stats.agents}
              icon={Bot}
              trend={stats.trends.agents}
            />
            <StatCard
              label="Messages Today"
              value={stats.messagesToday}
              icon={MessageSquare}
              trend={stats.trends.messages}
            />
            <StatCard
              label="Integrations"
              value={stats.integrations}
              icon={Wrench}
            />
          </div>
        )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Swarms</h2>
            <Button onClick={() => setCreateSwarmOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Swarm
            </Button>
          </div>

          {isLoadingSwarms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : swarms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Hexagon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">No swarms yet</p>
                <Button className="mt-4" onClick={() => setCreateSwarmOpen(true)}>
                  Create Your First Swarm
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {swarms.map((swarm) => (
                <SwarmCard key={swarm.id} swarm={swarm} />
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="p-6">
                <ActivityFeed activities={activities} isLoading={activitiesLoading} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <UsageCard stats={usageStats} isLoading={usageLoading} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => setCreateSwarmOpen(true)}>
                <Zap className="w-4 h-4 mr-2" />
                New Swarm
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/agents">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Agent
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setBroadcastOpen(true)}>
                <Send className="w-4 h-4 mr-2" />
                Broadcast Message
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Status</CardTitle>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No agents configured
                </p>
              ) : (
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: getAgentColor(agent) }}
                      >
                        {agent.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{agent.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                      </div>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

        <CreateSwarmDialog open={createSwarmOpen} onOpenChange={setCreateSwarmOpen} />
        <BroadcastMessageDialog open={broadcastOpen} onOpenChange={setBroadcastOpen} />
      </div>
    </PageTransition>
  )
}
