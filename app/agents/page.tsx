'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bot, Plus, Trash2, Brain, Cpu, Server, Wrench, Loader2, MessageSquare, Users, Clock, ChevronRight, Copy, Download, Upload, Sparkles, Store, ArrowUpCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyStateList } from '@/components/ui/empty-state'
import { DemoBanner } from '@/components/dashboard/demo-banner'
import { PageTransition } from '@/components/ui/page-transition'
import { LoadingButton } from '@/components/ui/loading-button'
import { useStore } from '@/store'
import { useAgents } from '@/hooks/use-agents'
import { useTools, type AgentTool } from '@/hooks/use-tools'
import { useAgentActivity, type AgentActivitySummary, type AgentActivity } from '@/hooks/use-agent-activity'
import { useAgentPresence } from '@/hooks/use-agent-presence'
import { StatusIndicator, StatusBadge } from '@/components/agents/status-indicator'
import { PublishAgentDialog, type PublishData } from '@/components/agents/publish-agent-dialog'
import { useMarketplaceActions, type MarketplaceAgent } from '@/hooks/use-marketplace'
import { useDefaultAgents, type TemplateVersionInfo } from '@/hooks/use-default-agents'
import { getAgentColor } from '@/lib/demo-engine'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import type { Agent } from '@/lib/supabase'

const frameworks = [
  { id: 'anthropic', name: 'Anthropic Claude', icon: Brain },
  { id: 'openai', name: 'OpenAI GPT', icon: Bot },
  { id: 'huggingface', name: 'HuggingFace', icon: Cpu },
  { id: 'local', name: 'Local (LM Studio/Ollama)', icon: Server },
]

const roles = ['Research Lead', 'Data Analyst', 'Developer', 'Creative Writer', 'Tool Specialist', 'Custom']

function ActivityItem({ activity }: { activity: AgentActivity }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'swarm_joined':
        return <Users className="w-4 h-4 text-green-500" />
      case 'tool_used':
        return <Wrench className="w-4 h-4 text-orange-500" />
    }
  }

  const getTitle = () => {
    switch (activity.type) {
      case 'message': {
        const msg = activity.data as any
        return `Sent message in ${msg.swarm?.name || 'Unknown Swarm'}`
      }
      case 'swarm_joined': {
        const swarm = activity.data as any
        return `Joined swarm: ${swarm.swarm?.name || 'Unknown Swarm'}`
      }
      case 'tool_used': {
        const usage = activity.data as any
        return `Used tool: ${usage.tool?.name || 'Unknown Tool'}`
      }
    }
  }

  const getDescription = () => {
    switch (activity.type) {
      case 'message': {
        const msg = activity.data as any
        const content = msg.content || ''
        return content.length > 100 ? content.substring(0, 100) + '...' : content
      }
      case 'swarm_joined': {
        const swarm = activity.data as any
        return swarm.swarm?.task || 'No task specified'
      }
      case 'tool_used': {
        const usage = activity.data as any
        return `Action: ${usage.action_type} in ${usage.swarm?.name || 'Unknown Swarm'}`
      }
    }
  }

  const getSwarmLink = () => {
    switch (activity.type) {
      case 'message': {
        const msg = activity.data as any
        return msg.swarm_id
      }
      case 'swarm_joined': {
        const swarm = activity.data as any
        return swarm.swarm_id
      }
      case 'tool_used': {
        const usage = activity.data as any
        return usage.swarm_id
      }
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{getTitle()}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {getDescription()}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </span>
          {getSwarmLink() && (
            <a
              href={`/swarms/${getSwarmLink()}`}
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              View Swarm
              <ChevronRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AgentsPage() {
  const router = useRouter()
  const { isDemo, agents } = useStore()
  const { fetchAgents, createAgent, editAgent, deleteAgent, duplicateAgent, downloadAgentExport, importAgent } = useAgents()
  const { tools, loading: toolsLoading, fetchAgentTools, toggleAgentTool } = useTools()
  const { fetchAgentActivity, loading: activityLoading } = useAgentActivity()
  const { getAgentStatus, presenceMap } = useAgentPresence()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [agentTools, setAgentTools] = useState<AgentTool[]>([])
  const [loadingAgentTools, setLoadingAgentTools] = useState(false)
  const [togglingTools, setTogglingTools] = useState<Set<string>>(new Set())
  const [activityData, setActivityData] = useState<AgentActivitySummary | null>(null)
  const [activityPage, setActivityPage] = useState(0)
  const [duplicating, setDuplicating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishingAgent, setPublishingAgent] = useState<Agent | null>(null)
  const [existingListing, setExistingListing] = useState<MarketplaceAgent | null>(null)
  const [publishedAgentIds, setPublishedAgentIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { publishAgent, unpublishAgent, updateMarketplaceAgent, getPublishedListingBySourceAgent } = useMarketplaceActions()
  const { checkForUpdates, upgradeAgent } = useDefaultAgents()
  const [updateInfo, setUpdateInfo] = useState<TemplateVersionInfo | null>(null)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: '',
    framework: 'anthropic',
    model: '',
    system_prompt: '',
    temperature: 0.7,
    style: 'friendly',
  })

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const loadAgentTools = useCallback(async (agentId: string) => {
    setLoadingAgentTools(true)
    try {
      const tools = await fetchAgentTools(agentId)
      setAgentTools(tools)
    } finally {
      setLoadingAgentTools(false)
    }
  }, [fetchAgentTools])

  useEffect(() => {
    if (selectedAgent) {
      loadAgentTools(selectedAgent.id)
    } else {
      setAgentTools([])
    }
  }, [selectedAgent, loadAgentTools])

  const loadActivity = useCallback(async (agentId: string, page: number) => {
    const data = await fetchAgentActivity(agentId, page)
    setActivityData(data)
  }, [fetchAgentActivity])

  useEffect(() => {
    if (selectedAgent) {
      setActivityPage(0)
      loadActivity(selectedAgent.id, 0)
    } else {
      setActivityData(null)
    }
  }, [selectedAgent, loadActivity])

  useEffect(() => {
    async function checkPublishedAgents() {
      if (isDemo || agents.length === 0) return

      const publishedIds = new Set<string>()
      for (const agent of agents) {
        const listing = await getPublishedListingBySourceAgent(agent.id)
        if (listing) {
          publishedIds.add(agent.id)
        }
      }
      setPublishedAgentIds(publishedIds)
    }
    checkPublishedAgents()
  }, [agents, isDemo, getPublishedListingBySourceAgent])

  const handleLoadMoreActivity = async () => {
    if (!selectedAgent || !activityData?.hasMore) return
    const nextPage = activityPage + 1
    setActivityPage(nextPage)
    const newData = await fetchAgentActivity(selectedAgent.id, nextPage)
    setActivityData({
      ...newData,
      activities: [...(activityData?.activities || []), ...newData.activities],
    })
  }

  const handleToggleTool = async (toolId: string, enabled: boolean) => {
    if (!selectedAgent) return

    setTogglingTools(prev => new Set(prev).add(toolId))
    try {
      await toggleAgentTool(selectedAgent.id, toolId, enabled)
      await loadAgentTools(selectedAgent.id)
    } finally {
      setTogglingTools(prev => {
        const next = new Set(prev)
        next.delete(toolId)
        return next
      })
    }
  }

  const isToolEnabled = (toolId: string): boolean => {
    const agentTool = agentTools.find(at => at.tool_id === toolId)
    return agentTool?.enabled ?? false
  }

  const handleCreateAgent = async () => {
    await createAgent({
      name: newAgent.name,
      role: newAgent.role,
      framework: newAgent.framework,
      model: newAgent.model || null,
      system_prompt: newAgent.system_prompt || null,
      settings: {
        temperature: newAgent.temperature,
        style: newAgent.style,
      },
    })
    setCreateDialogOpen(false)
    setNewAgent({
      name: '',
      role: '',
      framework: 'anthropic',
      model: '',
      system_prompt: '',
      temperature: 0.7,
      style: 'friendly',
    })
  }

  const handleDeleteAgent = async (id: string) => {
    await deleteAgent(id)
    if (selectedAgent?.id === id) {
      setSelectedAgent(null)
    }
  }

  const handleDuplicateAgent = async () => {
    if (!selectedAgent || duplicating) return
    setDuplicating(true)
    try {
      const { agent: newAgent } = await duplicateAgent(selectedAgent)
      setSelectedAgent(newAgent)
    } finally {
      setDuplicating(false)
    }
  }

  const handleExportAgent = () => {
    if (!selectedAgent) return
    downloadAgentExport(selectedAgent)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportError(null)

    try {
      const text = await file.text()
      const { agent: newAgent } = await importAgent(text)
      setSelectedAgent(newAgent)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import agent')
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleOpenPublishDialog = async (agent: Agent) => {
    setPublishingAgent(agent)
    const listing = await getPublishedListingBySourceAgent(agent.id)
    setExistingListing(listing)
    setPublishDialogOpen(true)
  }

  const handlePublishAgent = async (agentId: string, data: PublishData) => {
    await publishAgent(agentId, data)
    setPublishedAgentIds((prev) => new Set(prev).add(agentId))
  }

  const handleUpdateListing = async (listingId: string, updates: Partial<MarketplaceAgent>) => {
    await updateMarketplaceAgent(listingId, updates)
  }

  const handleUnpublishAgent = async (listingId: string) => {
    if (!publishingAgent) return
    await unpublishAgent(listingId)
    setPublishedAgentIds((prev) => {
      const next = new Set(prev)
      next.delete(publishingAgent.id)
      return next
    })
  }

  const handleCheckForUpdates = async (agent: Agent) => {
    if (!agent.source_template_id || !agent.source_template_version) return

    setCheckingUpdates(true)
    try {
      const info = await checkForUpdates(agent.source_template_id, agent.source_template_version)
      setUpdateInfo(info)
      if (info?.hasUpdate) {
        setUpgradeDialogOpen(true)
      } else {
        toast.success('Agent is up to date')
      }
    } catch (err) {
      toast.error('Failed to check for updates')
    } finally {
      setCheckingUpdates(false)
    }
  }

  const handleUpgradeAgent = async (preserveCustomizations: boolean) => {
    if (!selectedAgent || !updateInfo) return

    setUpgrading(true)
    try {
      await upgradeAgent(selectedAgent.id, updateInfo.templateId, preserveCustomizations)
      toast.success('Agent upgraded successfully')
      setUpgradeDialogOpen(false)
      setUpdateInfo(null)
      fetchAgents()
    } catch (err) {
      toast.error('Failed to upgrade agent')
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <PageTransition>
      <div className="p-4 lg:p-8">
        {isDemo && <DemoBanner />}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI Agent Management</h1>
          <p className="text-muted-foreground">Configure and manage your AI agents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/agents/templates')}>
            <Sparkles className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <LoadingButton variant="outline" onClick={handleImportClick} loading={importing}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </LoadingButton>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Agent
          </Button>
        </div>
      </div>

      {importError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {importError}
          <button
            onClick={() => setImportError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Agents</CardTitle>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <div className="space-y-4">
                  <EmptyStateList
                    icon={Bot}
                    title="No agents yet"
                    description="Create your first AI agent or start from a template"
                    action={{
                      label: 'Create Agent',
                      onClick: () => setCreateDialogOpen(true),
                    }}
                  />
                  <div className="text-center">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => router.push('/agents/templates')}
                      className="text-muted-foreground"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Browse Templates
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {agents.map((agent) => {
                    const agentStatus = getAgentStatus(agent.id)
                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedAgent?.id === agent.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: getAgentColor(agent) }}
                          >
                            {agent.name[0]}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                            <StatusIndicator
                              status={agentStatus.status}
                              activityType={agentStatus.activityType}
                              size="sm"
                              showTooltip={true}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium truncate">{agent.name}</p>
                            {publishedAgentIds.has(agent.id) && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                <Store className="w-2.5 h-2.5 mr-0.5" />
                                Published
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {agent.framework}
                        </Badge>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          {selectedAgent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                      style={{ backgroundColor: getAgentColor(selectedAgent) }}
                    >
                      {selectedAgent.name[0]}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                      <StatusIndicator
                        status={getAgentStatus(selectedAgent.id).status}
                        activityType={getAgentStatus(selectedAgent.id).activityType}
                        size="md"
                        showTooltip={true}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{selectedAgent.name}</h2>
                      <StatusBadge
                        status={getAgentStatus(selectedAgent.id).status}
                        activityType={getAgentStatus(selectedAgent.id).activityType}
                      />
                      {publishedAgentIds.has(selectedAgent.id) && (
                        <Badge variant="default" className="text-xs">
                          <Store className="w-3 h-3 mr-1" />
                          Published
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{selectedAgent.role}</p>
                  </div>
                  <Badge>{selectedAgent.framework}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="config">
                  <TabsList className="mb-4">
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="personality">Personality</TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="config" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Agent Name</Label>
                        <Input
                          value={selectedAgent.name}
                          onChange={(e) =>
                            editAgent(selectedAgent.id, { name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={selectedAgent.role || ''}
                          onValueChange={(value) =>
                            editAgent(selectedAgent.id, { role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>System Prompt</Label>
                      <Textarea
                        rows={6}
                        value={selectedAgent.system_prompt || ''}
                        onChange={(e) =>
                          editAgent(selectedAgent.id, { system_prompt: e.target.value })
                        }
                        placeholder="Define the agent's behavior and expertise..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Temperature: {(selectedAgent.settings as { temperature?: number })?.temperature || 0.7}</Label>
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={[(selectedAgent.settings as { temperature?: number })?.temperature || 0.7]}
                        onValueChange={([value]) =>
                          editAgent(selectedAgent.id, {
                            settings: { ...selectedAgent.settings, temperature: value },
                          })
                        }
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="personality" className="space-y-4">
                    <div className="space-y-4">
                      <Label>Communication Style</Label>
                      <RadioGroup
                        value={(selectedAgent.settings as { style?: string })?.style || 'friendly'}
                        onValueChange={(value) =>
                          editAgent(selectedAgent.id, {
                            settings: { ...selectedAgent.settings, style: value },
                          })
                        }
                      >
                        {[
                          { value: 'formal', label: 'Formal & Professional' },
                          { value: 'friendly', label: 'Friendly & Approachable' },
                          { value: 'concise', label: 'Brief & Concise' },
                          { value: 'detailed', label: 'Detailed & Thorough' },
                        ].map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label htmlFor={option.value}>{option.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </TabsContent>

                  <TabsContent value="tools" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Available Tools</h3>
                        <p className="text-xs text-muted-foreground">
                          Enable tools this agent can use in swarms
                        </p>
                      </div>
                      {(loadingAgentTools || toolsLoading) && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {tools.length === 0 ? (
                      <div className="border border-dashed rounded-lg">
                        <EmptyStateList
                          icon={Wrench}
                          title="No tools available"
                          description="Create tools in the Tools page to assign them to agents"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tools.map((tool) => {
                          const enabled = isToolEnabled(tool.id)
                          const isToggling = togglingTools.has(tool.id)
                          return (
                            <div
                              key={tool.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                enabled ? 'border-primary/30 bg-primary/5' : 'border-border'
                              }`}
                            >
                              <div className="pt-0.5">
                                {isToggling ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Switch
                                    checked={enabled}
                                    onCheckedChange={(checked) => handleToggleTool(tool.id, checked)}
                                    disabled={isToggling}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{tool.name}</span>
                                  {enabled && (
                                    <Badge variant="secondary" className="text-xs">
                                      Enabled
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {tool.description}
                                </p>
                                {tool.capabilities && Object.keys(tool.capabilities).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {Object.keys(tool.capabilities).slice(0, 3).map((cap) => (
                                      <Badge key={cap} variant="outline" className="text-xs">
                                        {cap}
                                      </Badge>
                                    ))}
                                    {Object.keys(tool.capabilities).length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{Object.keys(tool.capabilities).length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Enabled tools will be available to this agent when participating in swarms.
                        Tool availability can also be controlled at the swarm level.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Recent Activity</h3>
                        <p className="text-xs text-muted-foreground">
                          Messages, swarm participation, and tool usage
                        </p>
                      </div>
                      {activityLoading && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {activityData && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <MessageSquare className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                          <p className="text-lg font-semibold">{activityData.totalMessages}</p>
                          <p className="text-xs text-muted-foreground">Messages</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <Users className="w-5 h-5 mx-auto mb-1 text-green-500" />
                          <p className="text-lg font-semibold">{activityData.totalSwarms}</p>
                          <p className="text-xs text-muted-foreground">Swarms</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <Wrench className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                          <p className="text-lg font-semibold">{activityData.totalToolUsages}</p>
                          <p className="text-xs text-muted-foreground">Tool Uses</p>
                        </div>
                      </div>
                    )}

                    {!activityData || activityData.activities.length === 0 ? (
                      <div className="border border-dashed rounded-lg">
                        <EmptyStateList
                          icon={Clock}
                          title="No activity yet"
                          description="Activity will appear here when this agent participates in swarms"
                        />
                      </div>
                    ) : (
                      <>
                        <ScrollArea className="h-[320px]">
                          <div className="space-y-2 pr-4">
                            {activityData.activities.map((activity, index) => (
                              <ActivityItem key={`${activity.type}-${index}`} activity={activity} />
                            ))}
                          </div>
                        </ScrollArea>

                        {activityData.hasMore && (
                          <div className="flex justify-center pt-2">
                            <LoadingButton
                              variant="outline"
                              size="sm"
                              onClick={handleLoadMoreActivity}
                              loading={activityLoading}
                            >
                              Load More
                            </LoadingButton>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                {selectedAgent.source_template_id && (
                  <div className="flex items-center justify-between p-3 mt-6 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm">
                        Created from template
                        {selectedAgent.source_template_version && (
                          <Badge variant="outline" className="ml-2 font-mono text-xs">
                            v{selectedAgent.source_template_version}
                          </Badge>
                        )}
                      </span>
                    </div>
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckForUpdates(selectedAgent)}
                      loading={checkingUpdates}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Check for Updates
                    </LoadingButton>
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 mt-6 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenPublishDialog(selectedAgent)}
                  >
                    <Store className="w-4 h-4 mr-2" />
                    {publishedAgentIds.has(selectedAgent.id) ? 'Edit Listing' : 'Publish'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportAgent}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <LoadingButton
                    variant="outline"
                    onClick={handleDuplicateAgent}
                    loading={duplicating}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </LoadingButton>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteAgent(selectedAgent.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="py-16">
                <EmptyStateList
                  icon={Bot}
                  title="Select an agent"
                  description="Choose an agent from the list to view and edit its configuration"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>Set up a new AI agent for your swarms</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Agent Name</Label>
              <Input
                placeholder="e.g., ARIA"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newAgent.role}
                onValueChange={(value) => setNewAgent({ ...newAgent, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Framework</Label>
              <Select
                value={newAgent.framework}
                onValueChange={(value) => setNewAgent({ ...newAgent, framework: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((fw) => (
                    <SelectItem key={fw.id} value={fw.id}>
                      <div className="flex items-center gap-2">
                        <fw.icon className="w-4 h-4" />
                        {fw.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAgent} disabled={!newAgent.name || !newAgent.role}>
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {publishingAgent && (
        <PublishAgentDialog
          open={publishDialogOpen}
          onOpenChange={setPublishDialogOpen}
          agent={publishingAgent}
          existingListing={existingListing}
          onPublish={handlePublishAgent}
          onUpdate={handleUpdateListing}
          onUnpublish={handleUnpublishAgent}
        />
      )}

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-primary" />
              Update Available
            </DialogTitle>
            <DialogDescription>
              A newer version of this template is available
            </DialogDescription>
          </DialogHeader>

          {updateInfo && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <span className="text-sm text-muted-foreground">Current Version</span>
                  <p className="font-mono font-medium">v{updateInfo.currentVersion}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Latest Version</span>
                  <p className="font-mono font-medium text-primary">v{updateInfo.latestVersion}</p>
                </div>
              </div>

              {updateInfo.changelog && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Changelog</h4>
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border">
                    {updateInfo.changelog}
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You can choose to preserve your customizations or replace everything with the new template version.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
              Cancel
            </Button>
            <LoadingButton
              variant="outline"
              onClick={() => handleUpgradeAgent(false)}
              loading={upgrading}
            >
              Replace All
            </LoadingButton>
            <LoadingButton
              onClick={() => handleUpgradeAgent(true)}
              loading={upgrading}
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Keep My Changes
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageTransition>
  )
}
