'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Bot,
  Cpu,
  Server,
  Search,
  Globe,
  Terminal,
  Flame,
  Database,
  Layers,
  Zap,
  Check,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DemoBanner } from '@/components/dashboard/demo-banner'
import { useStore } from '@/store'
import { useIntegrations, type UserIntegration } from '@/hooks/use-integrations'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface TestResult {
  success: boolean
  message: string
  details?: Record<string, unknown>
}

async function testIntegrationConnection(
  integrationType: string,
  credentials: Record<string, string>
): Promise<TestResult> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, message: 'Not authenticated. Please log in.' }
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/test-integration`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ integrationType, credentials }),
    }
  )

  if (!response.ok) {
    if (response.status === 504) {
      return { success: false, message: 'Connection timed out. Please try again.' }
    }
    return { success: false, message: 'Failed to test connection. Please try again.' }
  }

  return response.json()
}

interface IntegrationConfig {
  id: string
  name: string
  description: string
  icon: React.ElementType
  badge?: string
  category: 'llm' | 'tools' | 'storage'
  fields: { name: string; label: string; type: string; placeholder?: string; required?: boolean }[]
}

const integrationConfigs: IntegrationConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus, and more',
    icon: Brain,
    category: 'llm',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...', required: true },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4 Turbo, o1, and more',
    icon: Bot,
    category: 'llm',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...', required: true },
    ],
  },
  {
    id: 'huggingface',
    name: 'HuggingFace',
    description: 'Access thousands of open models',
    icon: Cpu,
    category: 'llm',
    fields: [
      { name: 'token', label: 'API Token', type: 'password', placeholder: 'hf_...', required: true },
      { name: 'endpoint', label: 'Inference Endpoint (optional)', type: 'text', placeholder: 'https://api-inference.huggingface.co' },
    ],
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    description: 'Run models locally with LM Studio',
    icon: Server,
    badge: 'Local',
    category: 'llm',
    fields: [
      { name: 'url', label: 'Server URL', type: 'text', placeholder: 'http://localhost:1234/v1', required: true },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run Llama, Mistral, and more locally',
    icon: Server,
    badge: 'Local',
    category: 'llm',
    fields: [
      { name: 'url', label: 'Server URL', type: 'text', placeholder: 'http://localhost:11434', required: true },
    ],
  },
  {
    id: 'custom_llm',
    name: 'Custom OpenAI-Compatible',
    description: 'Any OpenAI API-compatible endpoint',
    icon: Server,
    category: 'llm',
    fields: [
      { name: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://your-server.com/v1', required: true },
      { name: 'apiKey', label: 'API Key', type: 'password' },
      { name: 'model', label: 'Model Name', type: 'text', placeholder: 'your-model-name' },
    ],
  },
  {
    id: 'tavily',
    name: 'Tavily Search',
    description: 'AI-powered web search',
    icon: Search,
    category: 'tools',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'tvly-...', required: true },
    ],
  },
  {
    id: 'browserbase',
    name: 'Browserbase',
    description: 'Browser automation',
    icon: Globe,
    category: 'tools',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'projectId', label: 'Project ID', type: 'text' },
    ],
  },
  {
    id: 'e2b',
    name: 'E2B Code Sandbox',
    description: 'Secure code execution',
    icon: Terminal,
    category: 'tools',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: 'Web scraping at scale',
    icon: Flame,
    category: 'tools',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    description: 'Vector database for semantic search and RAG',
    icon: Layers,
    category: 'storage',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'pcsk_...', required: true },
      { name: 'environment', label: 'Environment', type: 'text', placeholder: 'us-east-1-aws' },
      { name: 'indexName', label: 'Index Name', type: 'text', placeholder: 'my-index' },
    ],
  },
  {
    id: 'redis',
    name: 'Redis / Upstash',
    description: 'In-memory cache for fast data retrieval',
    icon: Zap,
    category: 'storage',
    fields: [
      { name: 'url', label: 'Connection URL', type: 'password', placeholder: 'redis://default:...@host:port', required: true },
      { name: 'password', label: 'Password (if separate)', type: 'password', placeholder: 'Optional if included in URL' },
    ],
  },
]

interface IntegrationCardProps {
  config: IntegrationConfig
  savedIntegration?: UserIntegration
  onSave: (type: string, name: string, credentials: Record<string, string>) => Promise<void>
  onDisconnect: (id: string) => Promise<void>
  onReconnect: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function IntegrationCard({
  config,
  savedIntegration,
  onSave,
  onDisconnect,
  onReconnect,
  onDelete,
}: IntegrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const isConnected = savedIntegration?.is_connected ?? false
  const hasCredentials = !!savedIntegration

  useEffect(() => {
    if (isExpanded && !savedIntegration) {
      setFormData({})
    }
  }, [savedIntegration, isExpanded])

  const handleSave = async () => {
    const requiredFields = config.fields.filter((f) => f.required)
    const missingFields = requiredFields.filter((f) => !formData[f.name]?.trim())

    if (missingFields.length > 0) {
      return
    }

    setIsSaving(true)
    try {
      await onSave(config.id, config.name, formData)
      setIsExpanded(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    const requiredFields = config.fields.filter((f) => f.required)
    const missingFields = requiredFields.filter((f) => !formData[f.name]?.trim())

    if (missingFields.length > 0) {
      setTestResult({
        success: false,
        message: `Please fill in required fields: ${missingFields.map((f) => f.label).join(', ')}`,
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await testIntegrationConnection(config.id, formData)
      setTestResult(result)
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!savedIntegration) return
    setIsSaving(true)
    try {
      await onDisconnect(savedIntegration.id)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReconnect = async () => {
    if (!savedIntegration) return
    setIsSaving(true)
    try {
      await onReconnect(savedIntegration.id)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!savedIntegration) return
    setIsSaving(true)
    try {
      await onDelete(savedIntegration.id)
      setDeleteDialogOpen(false)
      setIsExpanded(false)
    } finally {
      setIsSaving(false)
    }
  }

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }))
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={isConnected ? 'border-emerald-500/50' : hasCredentials ? 'border-amber-500/50' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isConnected ? 'bg-emerald-500/10' : 'bg-primary/10'
                }`}>
                  <config.icon className={`w-5 h-5 ${isConnected ? 'text-emerald-500' : 'text-primary'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{config.name}</CardTitle>
                    {config.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {config.badge}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">{config.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : hasCredentials ? (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Disconnected
                  </Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isExpanded && config.fields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4"
              >
                {config.fields.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        type={field.type === 'password' && !showPasswords[field.name] ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: e.target.value })
                        }
                      />
                      {field.type === 'password' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => togglePasswordVisibility(field.name)}
                        >
                          {showPasswords[field.name] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    {hasCredentials && savedIntegration?.masked_credentials[field.name] && !formData[field.name] && (
                      <p className="text-xs text-muted-foreground">
                        Current: {savedIntegration.masked_credentials[field.name]}
                      </p>
                    )}
                  </div>
                ))}

                {testResult && (
                  <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p>{testResult.message}</p>
                      {testResult.details && Object.keys(testResult.details).length > 0 && (
                        <p className="text-xs mt-1 opacity-80">
                          {Object.entries(testResult.details)
                            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                            .join(' | ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {!isExpanded && hasCredentials && savedIntegration?.updated_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Last updated: {new Date(savedIntegration.updated_at).toLocaleDateString()}
              </p>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            {isExpanded ? (
              <div className="flex flex-wrap gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false)
                    setFormData({})
                    setTestResult(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={isTesting || isSaving}
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
                {hasCredentials && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || isTesting}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                {hasCredentials && !isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReconnect}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Reconnect
                  </Button>
                )}
                {hasCredentials && isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isSaving}
                  >
                    Disconnect
                  </Button>
                )}
                <Button
                  variant={isConnected ? 'outline' : 'default'}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setFormData({})
                    setIsExpanded(true)
                  }}
                  disabled={config.fields.length === 0}
                >
                  {hasCredentials ? 'Configure' : 'Connect'}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Integration</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your saved credentials for {config.name}.
              You will need to re-enter them to use this integration again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function IntegrationsPage() {
  const { isDemo } = useStore()
  const { toast } = useToast()
  const {
    integrations,
    loading,
    saveIntegration,
    disconnectIntegration,
    reconnectIntegration,
    deleteIntegration,
    getIntegration,
  } = useIntegrations()

  const llmConfigs = integrationConfigs.filter((c) => c.category === 'llm')
  const toolConfigs = integrationConfigs.filter((c) => c.category === 'tools')
  const storageConfigs = integrationConfigs.filter((c) => c.category === 'storage')

  const handleSave = async (type: string, name: string, credentials: Record<string, string>) => {
    try {
      await saveIntegration(type, name, credentials)
      toast({
        title: 'Integration saved',
        description: `${name} has been connected successfully.`,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save integration',
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleDisconnect = async (id: string) => {
    try {
      await disconnectIntegration(id)
      toast({
        title: 'Integration disconnected',
        description: 'The integration has been disconnected but credentials are preserved.',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to disconnect',
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleReconnect = async (id: string) => {
    try {
      await reconnectIntegration(id)
      toast({
        title: 'Integration reconnected',
        description: 'The integration is now active.',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reconnect',
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteIntegration(id)
      toast({
        title: 'Integration removed',
        description: 'The integration and its credentials have been deleted.',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete',
        variant: 'destructive',
      })
      throw err
    }
  }

  const connectedCount = integrations.filter((i) => i.is_connected).length

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {isDemo && <DemoBanner />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI Model & Tool Integrations</h1>
          <p className="text-muted-foreground">
            Connect LLM providers like OpenAI, Anthropic, and Google to power your multi-agent swarms
          </p>
        </div>
        {connectedCount > 0 && (
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
            <Check className="w-3 h-3 mr-1" />
            {connectedCount} connected
          </Badge>
        )}
      </div>

      <Tabs defaultValue="llm">
        <TabsList className="mb-6">
          <TabsTrigger value="llm">AI Models</TabsTrigger>
          <TabsTrigger value="tools">Tool Services</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="llm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {llmConfigs.map((config) => (
              <IntegrationCard
                key={config.id}
                config={config}
                savedIntegration={getIntegration(config.id)}
                onSave={handleSave}
                onDisconnect={handleDisconnect}
                onReconnect={handleReconnect}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {toolConfigs.map((config) => (
              <IntegrationCard
                key={config.id}
                config={config}
                savedIntegration={getIntegration(config.id)}
                onSave={handleSave}
                onDisconnect={handleDisconnect}
                onReconnect={handleReconnect}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-center mb-4">
                More tool integrations coming soon
              </p>
              <Button variant="outline" asChild>
                <a href="https://hive.protocol/docs/tools" target="_blank" rel="noopener noreferrer">
                  View Documentation
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
            <h3 className="font-medium mb-2">Storage Integrations</h3>
            <p className="text-sm text-muted-foreground">
              Connect external storage services to enhance your agents with vector search capabilities and caching.
              When configured, these integrations are available to all agents in your swarms.
            </p>
          </div>
          <Card className="mb-4 border-emerald-500/50">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Supabase</CardTitle>
                    <CardDescription className="text-xs">PostgreSQL & Realtime</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Supabase is automatically configured as your primary database for storing swarms, messages, and agent data.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storageConfigs.map((config) => (
              <IntegrationCard
                key={config.id}
                config={config}
                savedIntegration={getIntegration(config.id)}
                onSave={handleSave}
                onDisconnect={handleDisconnect}
                onReconnect={handleReconnect}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Card className="mt-6 bg-muted/30">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <h4 className="font-medium">Pinecone Usage</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Store and retrieve document embeddings</li>
                    <li>Enable semantic search across knowledge bases</li>
                    <li>Power RAG (Retrieval Augmented Generation)</li>
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <h4 className="font-medium">Redis Usage</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Cache agent responses for faster retrieval</li>
                    <li>Store session data and conversation context</li>
                    <li>Rate limiting and request throttling</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Zap className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Webhooks</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Configure webhooks to receive real-time updates when events happen in your swarms
              </p>
              <Button className="mt-6" asChild>
                <a href="/settings?tab=webhooks">Configure Webhooks</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
