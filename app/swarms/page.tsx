'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Hexagon, Plus, Search, Filter, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { EmptyState } from '@/components/ui/empty-state'
import { DemoBanner } from '@/components/dashboard/demo-banner'
import { SwarmCard } from '@/components/dashboard/swarm-card'
import { CreateSwarmDialog } from '@/components/dashboard/create-swarm-dialog'
import { useStore } from '@/store'
import { useSwarmRealtime } from '@/hooks/use-swarm-realtime'
import { useKeyboardShortcuts, getShortcutDisplay } from '@/hooks/use-keyboard-shortcuts'
import { cn } from '@/lib/utils'

export default function SwarmsPage() {
  const { isDemo, swarms } = useStore()
  const { connectionStatus, reconnect } = useSwarmRealtime({
    showNotifications: true,
  })
  const [createSwarmOpen, setCreateSwarmOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useKeyboardShortcuts([
    {
      key: 'n',
      description: 'Create new swarm',
      action: () => setCreateSwarmOpen(true),
    },
    {
      key: '/',
      description: 'Focus search',
      action: () => searchInputRef.current?.focus(),
    },
  ])

  const filteredSwarms = swarms.filter((swarm) => {
    const matchesSearch = swarm.name.toLowerCase().includes(search.toLowerCase()) ||
      (swarm.task?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === 'all' || swarm.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-4 lg:p-8">
      {isDemo && <DemoBanner />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Multi-Agent Swarms</h1>
          <p className="text-muted-foreground">Manage your AI agent collaborations</p>
        </div>
        <div className="flex items-center gap-3">
          {!isDemo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-8 px-2 gap-1.5',
                      connectionStatus === 'connected' && 'text-emerald-500',
                      connectionStatus === 'connecting' && 'text-amber-500',
                      (connectionStatus === 'disconnected' || connectionStatus === 'error') && 'text-red-500'
                    )}
                    onClick={connectionStatus !== 'connected' ? reconnect : undefined}
                  >
                    {connectionStatus === 'connected' ? (
                      <Wifi className="w-4 h-4" />
                    ) : (
                      <WifiOff className="w-4 h-4" />
                    )}
                    <span className="text-xs hidden sm:inline">
                      {connectionStatus === 'connected' && 'Live'}
                      {connectionStatus === 'connecting' && 'Connecting...'}
                      {connectionStatus === 'disconnected' && 'Offline'}
                      {connectionStatus === 'error' && 'Reconnect'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {connectionStatus === 'connected' && 'Real-time updates active'}
                  {connectionStatus === 'connecting' && 'Establishing connection...'}
                  {connectionStatus === 'disconnected' && 'Click to reconnect'}
                  {connectionStatus === 'error' && 'Connection failed - click to retry'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setCreateSwarmOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Swarm
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Create new swarm</span>
                  <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted">N</kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search swarms..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-2">
                <span>Focus search</span>
                <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted">/</kbd>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSwarms.length === 0 ? (
        search || statusFilter !== 'all' ? (
          <EmptyState
            icon={Search}
            title="No swarms found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={{
              label: 'Clear Filters',
              onClick: () => {
                setSearch('')
                setStatusFilter('all')
              },
              variant: 'outline',
            }}
            variant="card"
          />
        ) : (
          <EmptyState
            icon={Hexagon}
            title="Create your first swarm"
            description="Swarms enable multiple AI agents to collaborate on complex tasks. Start by creating a swarm and adding agents with different capabilities."
            action={{
              label: 'Create Swarm',
              onClick: () => setCreateSwarmOpen(true),
            }}
            variant="card"
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSwarms.map((swarm, i) => (
            <motion.div
              key={swarm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SwarmCard swarm={swarm} />
            </motion.div>
          ))}
        </div>
      )}

      <CreateSwarmDialog open={createSwarmOpen} onOpenChange={setCreateSwarmOpen} />
    </div>
  )
}
