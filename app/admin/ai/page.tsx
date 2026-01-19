'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Key,
  Gauge,
  Bot,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Check,
  X,
  Loader2,
  DollarSign,
  Zap,
  Settings2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAdminAI,
  type AIModel,
  type ModelApiKey,
  type PlanRateLimit,
  type DefaultAgent,
  type AIStats,
} from '@/hooks/use-admin-ai'
import { useToast } from '@/hooks/use-toast'

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'cohere', label: 'Cohere' },
]

const FRAMEWORKS = [
  { value: 'langchain', label: 'LangChain' },
  { value: 'autogen', label: 'AutoGen' },
  { value: 'crewai', label: 'CrewAI' },
  { value: 'custom', label: 'Custom' },
]

function StatCard({ title, value, icon: Icon, loading }: {
  title: string
  value: number
  icon: React.ElementType
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminAIPage() {
  const {
    getStats,
    listModels,
    createModel,
    updateModel,
    deleteModel,
    listApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    listRateLimits,
    upsertRateLimit,
    listDefaultAgents,
    createDefaultAgent,
    updateDefaultAgent,
    deleteDefaultAgent,
  } = useAdminAI()
  const { toast } = useToast()

  const [stats, setStats] = useState<AIStats | null>(null)
  const [models, setModels] = useState<AIModel[]>([])
  const [apiKeys, setApiKeys] = useState<ModelApiKey[]>([])
  const [rateLimits, setRateLimits] = useState<PlanRateLimit[]>([])
  const [defaultAgents, setDefaultAgents] = useState<DefaultAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('models')

  const [modelDialogOpen, setModelDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<AIModel | null>(null)
  const [modelForm, setModelForm] = useState({
    name: '',
    provider: 'openai',
    model_id: '',
    description: '',
    context_window: 4096,
    max_output_tokens: 4096,
    input_cost_per_1k: 0,
    output_cost_per_1k: 0,
    is_active: true,
    is_default: false,
  })

  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  const [apiKeyForm, setApiKeyForm] = useState({
    provider: 'openai',
    key_name: '',
    encrypted_key: '',
  })

  const [rateLimitDialogOpen, setRateLimitDialogOpen] = useState(false)
  const [editingRateLimit, setEditingRateLimit] = useState<PlanRateLimit | null>(null)
  const [rateLimitForm, setRateLimitForm] = useState({
    plan: 'free',
    requests_per_minute: 10,
    requests_per_day: 100,
    tokens_per_day: 100000,
    max_agents: 5,
    max_swarms: 3,
  })

  const [agentDialogOpen, setAgentDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<DefaultAgent | null>(null)
  const [agentForm, setAgentForm] = useState({
    name: '',
    role: '',
    framework: 'custom',
    model_id: '',
    system_prompt: '',
    is_active: true,
    sort_order: 0,
  })

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsData, modelsData, keysData, limitsData, agentsData] = await Promise.all([
        getStats(),
        listModels(),
        listApiKeys(),
        listRateLimits(),
        listDefaultAgents(),
      ])
      setStats(statsData)
      setModels(modelsData)
      setApiKeys(keysData)
      setRateLimits(limitsData)
      setDefaultAgents(agentsData)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load data',
      })
    } finally {
      setLoading(false)
    }
  }, [getStats, listModels, listApiKeys, listRateLimits, listDefaultAgents, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveModel = async () => {
    try {
      setSaving(true)
      if (editingModel) {
        await updateModel(editingModel.id, modelForm)
        toast({ title: 'Model updated' })
      } else {
        await createModel(modelForm)
        toast({ title: 'Model created' })
      }
      setModelDialogOpen(false)
      setEditingModel(null)
      loadData()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to save model' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveApiKey = async () => {
    try {
      setSaving(true)
      await createApiKey(apiKeyForm)
      toast({ title: 'API key added' })
      setApiKeyDialogOpen(false)
      setApiKeyForm({ provider: 'openai', key_name: '', encrypted_key: '' })
      loadData()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to save API key' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRateLimit = async () => {
    try {
      setSaving(true)
      await upsertRateLimit(rateLimitForm)
      toast({ title: 'Rate limit saved' })
      setRateLimitDialogOpen(false)
      setEditingRateLimit(null)
      loadData()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to save rate limit' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAgent = async () => {
    try {
      setSaving(true)
      if (editingAgent) {
        await updateDefaultAgent(editingAgent.id, agentForm)
        toast({ title: 'Agent updated' })
      } else {
        await createDefaultAgent(agentForm)
        toast({ title: 'Agent created' })
      }
      setAgentDialogOpen(false)
      setEditingAgent(null)
      loadData()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to save agent' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setSaving(true)
      switch (deleteTarget.type) {
        case 'model':
          await deleteModel(deleteTarget.id)
          break
        case 'apiKey':
          await deleteApiKey(deleteTarget.id)
          break
        case 'agent':
          await deleteDefaultAgent(deleteTarget.id)
          break
      }
      toast({ title: `${deleteTarget.type === 'apiKey' ? 'API key' : deleteTarget.type} deleted` })
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete' })
    } finally {
      setSaving(false)
    }
  }

  const openModelDialog = (model?: AIModel) => {
    if (model) {
      setEditingModel(model)
      setModelForm({
        name: model.name,
        provider: model.provider,
        model_id: model.model_id,
        description: model.description || '',
        context_window: model.context_window,
        max_output_tokens: model.max_output_tokens,
        input_cost_per_1k: model.input_cost_per_1k,
        output_cost_per_1k: model.output_cost_per_1k,
        is_active: model.is_active,
        is_default: model.is_default,
      })
    } else {
      setEditingModel(null)
      setModelForm({
        name: '',
        provider: 'openai',
        model_id: '',
        description: '',
        context_window: 4096,
        max_output_tokens: 4096,
        input_cost_per_1k: 0,
        output_cost_per_1k: 0,
        is_active: true,
        is_default: false,
      })
    }
    setModelDialogOpen(true)
  }

  const openRateLimitDialog = (limit?: PlanRateLimit) => {
    if (limit) {
      setEditingRateLimit(limit)
      setRateLimitForm({
        plan: limit.plan,
        requests_per_minute: limit.requests_per_minute,
        requests_per_day: limit.requests_per_day,
        tokens_per_day: limit.tokens_per_day,
        max_agents: limit.max_agents,
        max_swarms: limit.max_swarms,
      })
    } else {
      setEditingRateLimit(null)
      setRateLimitForm({
        plan: 'free',
        requests_per_minute: 10,
        requests_per_day: 100,
        tokens_per_day: 100000,
        max_agents: 5,
        max_swarms: 3,
      })
    }
    setRateLimitDialogOpen(true)
  }

  const openAgentDialog = (agent?: DefaultAgent) => {
    if (agent) {
      setEditingAgent(agent)
      setAgentForm({
        name: agent.name,
        role: agent.role || '',
        framework: agent.framework,
        model_id: agent.model_id || '',
        system_prompt: agent.system_prompt || '',
        is_active: agent.is_active,
        sort_order: agent.sort_order,
      })
    } else {
      setEditingAgent(null)
      setAgentForm({
        name: '',
        role: '',
        framework: 'custom',
        model_id: '',
        system_prompt: '',
        is_active: true,
        sort_order: defaultAgents.length,
      })
    }
    setAgentDialogOpen(true)
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-emerald-500/20 text-emerald-600'
      case 'anthropic': return 'bg-orange-500/20 text-orange-600'
      case 'google': return 'bg-blue-500/20 text-blue-600'
      case 'mistral': return 'bg-cyan-500/20 text-cyan-600'
      default: return 'bg-gray-500/20 text-gray-600'
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI & Models Management</h1>
          <p className="text-muted-foreground">Configure AI models, API keys, and rate limits</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="AI Models" value={stats?.total_models || 0} icon={Brain} loading={loading} />
        <StatCard title="Total Agents" value={stats?.total_agents || 0} icon={Bot} loading={loading} />
        <StatCard title="Total Swarms" value={stats?.total_swarms || 0} icon={Zap} loading={loading} />
        <StatCard title="Default Agents" value={stats?.total_default_agents || 0} icon={Settings2} loading={loading} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="models">
            <Brain className="w-4 h-4 mr-2" />
            Models
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="rate-limits">
            <Gauge className="w-4 h-4 mr-2" />
            Rate Limits
          </TabsTrigger>
          <TabsTrigger value="default-agents">
            <Bot className="w-4 h-4 mr-2" />
            Default Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>AI Models</CardTitle>
                <CardDescription>Available AI models for agents</CardDescription>
              </div>
              <Button onClick={() => openModelDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Cost (per 1K tokens)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{model.name}</p>
                            <p className="text-sm text-muted-foreground">{model.model_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getProviderColor(model.provider)}>
                            {model.provider}
                          </Badge>
                        </TableCell>
                        <TableCell>{model.context_window.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-muted-foreground">In:</span> ${model.input_cost_per_1k}
                            <span className="mx-2 text-muted-foreground">|</span>
                            <span className="text-muted-foreground">Out:</span> ${model.output_cost_per_1k}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {model.is_active ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-600/30">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {model.is_default && (
                              <Badge>Default</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openModelDialog(model)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeleteTarget({ type: 'model', id: model.id, name: model.name })
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage API keys for AI providers</CardDescription>
              </div>
              <Button onClick={() => setApiKeyDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Key
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No API keys configured
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.key_name}</TableCell>
                        <TableCell>
                          <Badge className={getProviderColor(key.provider)}>
                            {key.provider}
                          </Badge>
                        </TableCell>
                        <TableCell>{key.usage_count.toLocaleString()} requests</TableCell>
                        <TableCell>
                          <Switch
                            checked={key.is_active}
                            onCheckedChange={async (checked) => {
                              await updateApiKey(key.id, { is_active: checked })
                              loadData()
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteTarget({ type: 'apiKey', id: key.id, name: key.key_name })
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rate Limits</CardTitle>
                <CardDescription>Configure rate limits per subscription plan</CardDescription>
              </div>
              <Button onClick={() => openRateLimitDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Limit
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Requests/Min</TableHead>
                      <TableHead>Requests/Day</TableHead>
                      <TableHead>Tokens/Day</TableHead>
                      <TableHead>Max Agents</TableHead>
                      <TableHead>Max Swarms</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rateLimits.filter(l => !l.model_id).map((limit) => (
                      <TableRow key={limit.id}>
                        <TableCell>
                          <Badge className={
                            limit.plan === 'enterprise' ? 'bg-amber-500/20 text-amber-600' :
                            limit.plan === 'pro' ? 'bg-blue-500/20 text-blue-600' :
                            'bg-gray-500/20 text-gray-600'
                          }>
                            {limit.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>{limit.requests_per_minute}</TableCell>
                        <TableCell>{limit.requests_per_day.toLocaleString()}</TableCell>
                        <TableCell>{limit.tokens_per_day.toLocaleString()}</TableCell>
                        <TableCell>{limit.max_agents}</TableCell>
                        <TableCell>{limit.max_swarms}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRateLimitDialog(limit)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="default-agents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Default Agents</CardTitle>
                <CardDescription>System-wide default agent templates</CardDescription>
              </div>
              <Button onClick={() => openAgentDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Agent
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : defaultAgents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No default agents configured
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Framework</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaultAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-sm text-muted-foreground">{agent.role || 'No role'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{agent.framework}</Badge>
                        </TableCell>
                        <TableCell>
                          {agent.ai_models ? (
                            <span className="text-sm">{agent.ai_models.name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={agent.is_active}
                            onCheckedChange={async (checked) => {
                              await updateDefaultAgent(agent.id, { is_active: checked })
                              loadData()
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openAgentDialog(agent)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeleteTarget({ type: 'agent', id: agent.id, name: agent.name })
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingModel ? 'Edit Model' : 'Add Model'}</DialogTitle>
            <DialogDescription>Configure AI model settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={modelForm.name}
                  onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                  placeholder="GPT-4o"
                />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={modelForm.provider} onValueChange={(v) => setModelForm({ ...modelForm, provider: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Model ID</Label>
              <Input
                value={modelForm.model_id}
                onChange={(e) => setModelForm({ ...modelForm, model_id: e.target.value })}
                placeholder="gpt-4o"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={modelForm.description}
                onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Context Window</Label>
                <Input
                  type="number"
                  value={modelForm.context_window}
                  onChange={(e) => setModelForm({ ...modelForm, context_window: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Output Tokens</Label>
                <Input
                  type="number"
                  value={modelForm.max_output_tokens}
                  onChange={(e) => setModelForm({ ...modelForm, max_output_tokens: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Input Cost (per 1K)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={modelForm.input_cost_per_1k}
                  onChange={(e) => setModelForm({ ...modelForm, input_cost_per_1k: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Output Cost (per 1K)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={modelForm.output_cost_per_1k}
                  onChange={(e) => setModelForm({ ...modelForm, output_cost_per_1k: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <Switch
                  checked={modelForm.is_active}
                  onCheckedChange={(checked) => setModelForm({ ...modelForm, is_active: checked })}
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={modelForm.is_default}
                  onCheckedChange={(checked) => setModelForm({ ...modelForm, is_default: checked })}
                />
                <span className="text-sm">Default</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModelDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveModel} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
            <DialogDescription>Add a new API key for an AI provider</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={apiKeyForm.provider} onValueChange={(v) => setApiKeyForm({ ...apiKeyForm, provider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Key Name</Label>
              <Input
                value={apiKeyForm.key_name}
                onChange={(e) => setApiKeyForm({ ...apiKeyForm, key_name: e.target.value })}
                placeholder="Production Key"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={apiKeyForm.encrypted_key}
                onChange={(e) => setApiKeyForm({ ...apiKeyForm, encrypted_key: e.target.value })}
                placeholder="sk-..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveApiKey} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rateLimitDialogOpen} onOpenChange={setRateLimitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRateLimit ? 'Edit Rate Limit' : 'Add Rate Limit'}</DialogTitle>
            <DialogDescription>Configure rate limits for a subscription plan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={rateLimitForm.plan} onValueChange={(v) => setRateLimitForm({ ...rateLimitForm, plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requests/Minute</Label>
                <Input
                  type="number"
                  value={rateLimitForm.requests_per_minute}
                  onChange={(e) => setRateLimitForm({ ...rateLimitForm, requests_per_minute: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Requests/Day</Label>
                <Input
                  type="number"
                  value={rateLimitForm.requests_per_day}
                  onChange={(e) => setRateLimitForm({ ...rateLimitForm, requests_per_day: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tokens/Day</Label>
              <Input
                type="number"
                value={rateLimitForm.tokens_per_day}
                onChange={(e) => setRateLimitForm({ ...rateLimitForm, tokens_per_day: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Agents</Label>
                <Input
                  type="number"
                  value={rateLimitForm.max_agents}
                  onChange={(e) => setRateLimitForm({ ...rateLimitForm, max_agents: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Swarms</Label>
                <Input
                  type="number"
                  value={rateLimitForm.max_swarms}
                  onChange={(e) => setRateLimitForm({ ...rateLimitForm, max_swarms: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateLimitDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRateLimit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAgent ? 'Edit Default Agent' : 'Add Default Agent'}</DialogTitle>
            <DialogDescription>Configure a system-wide default agent template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  placeholder="Research Assistant"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={agentForm.role}
                  onChange={(e) => setAgentForm({ ...agentForm, role: e.target.value })}
                  placeholder="researcher"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Framework</Label>
                <Select value={agentForm.framework} onValueChange={(v) => setAgentForm({ ...agentForm, framework: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Model</Label>
                <Select value={agentForm.model_id || 'none'} onValueChange={(v) => setAgentForm({ ...agentForm, model_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {models.filter(m => m.is_active).map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea
                value={agentForm.system_prompt}
                onChange={(e) => setAgentForm({ ...agentForm, system_prompt: e.target.value })}
                rows={4}
                placeholder="You are a helpful assistant..."
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-2 flex-1">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={agentForm.sort_order}
                  onChange={(e) => setAgentForm({ ...agentForm, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <label className="flex items-center gap-2 pt-6">
                <Switch
                  checked={agentForm.is_active}
                  onCheckedChange={(checked) => setAgentForm({ ...agentForm, is_active: checked })}
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAgent} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTarget?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
