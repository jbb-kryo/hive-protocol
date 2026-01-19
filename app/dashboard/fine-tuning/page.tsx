'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, Database, Rocket, CheckCircle, XCircle, Clock,
  AlertTriangle, Download, Trash2, Plus, RefreshCw, Loader2,
  Play, StopCircle, Info, DollarSign, Calendar, Activity,
  FileText, TrendingUp, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageTransition } from '@/components/ui/page-transition'
import { EmptyState } from '@/components/ui/empty-state'
import { Checkbox } from '@/components/ui/checkbox'
import dynamic from 'next/dynamic'

const Progress = dynamic(() => import('@/components/ui/progress').then(mod => ({ default: mod.Progress })), {
  ssr: false,
  loading: () => <div className="h-2 w-full bg-secondary rounded-full" />
})
import { useFineTuning } from '@/hooks/use-fine-tuning'
import { useAgents } from '@/hooks/use-agents'
import { toast } from 'sonner'
import { format, subDays } from 'date-fns'

const BASE_MODELS = [
  { value: 'gpt-4o-2024-08-06', label: 'GPT-4o', cost: '$25/M tokens' },
  { value: 'gpt-4o-mini-2024-07-18', label: 'GPT-4o Mini', cost: '$3/M tokens' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', cost: '$8/M tokens' },
]

const STATUS_COLORS = {
  preparing: 'bg-blue-500/10 text-blue-600',
  ready: 'bg-green-500/10 text-green-600',
  uploaded: 'bg-emerald-500/10 text-emerald-600',
  error: 'bg-red-500/10 text-red-600',
  validating_files: 'bg-yellow-500/10 text-yellow-600',
  queued: 'bg-amber-500/10 text-amber-600',
  running: 'bg-blue-500/10 text-blue-600',
  succeeded: 'bg-green-500/10 text-green-600',
  failed: 'bg-red-500/10 text-red-600',
  cancelled: 'bg-gray-500/10 text-gray-600',
}

function formatCurrency(num: number): string {
  if (num < 0.01) return `$${num.toFixed(4)}`
  if (num < 1) return `$${num.toFixed(3)}`
  return `$${num.toFixed(2)}`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(0)
}

export default function FineTuningPage() {
  const {
    loading,
    datasets,
    jobs,
    models,
    fetchDatasets,
    fetchJobs,
    fetchModels,
    createDataset,
    generateTrainingData,
    submitFineTuningJob,
    checkJobStatus,
    cancelJob,
    deleteDataset,
    deleteJob,
    toggleModelActive,
    deleteModel,
    estimateCost,
    exportTrainingData,
  } = useFineTuning()

  const { agents, fetchAgents } = useAgents()

  const [showCreateDataset, setShowCreateDataset] = useState(false)
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [newDataset, setNewDataset] = useState({
    name: '',
    description: '',
    source_type: 'conversations',
    agent_ids: [] as string[],
    date_range_start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    date_range_end: format(new Date(), 'yyyy-MM-dd'),
    filters: {
      min_satisfaction: 4,
      success_only: true,
    },
  })

  const [newJob, setNewJob] = useState({
    dataset_id: '',
    name: '',
    base_model: 'gpt-4o-mini-2024-07-18',
    hyperparameters: {
      n_epochs: 3,
    },
  })

  const [estimatedCost, setEstimatedCost] = useState<number | null>(null)

  useEffect(() => {
    fetchDatasets()
    fetchJobs()
    fetchModels()
    fetchAgents()
  }, [fetchDatasets, fetchJobs, fetchModels, fetchAgents])

  const handleCreateDataset = async () => {
    if (!newDataset.name) {
      toast.error('Please enter a dataset name')
      return
    }

    try {
      const dataset = await createDataset(newDataset)
      toast.success('Dataset created successfully')
      setShowCreateDataset(false)
      setNewDataset({
        name: '',
        description: '',
        source_type: 'conversations',
        agent_ids: [],
        date_range_start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        date_range_end: format(new Date(), 'yyyy-MM-dd'),
        filters: {
          min_satisfaction: 4,
          success_only: true,
        },
      })

      toast.info('Generating training data...')
      await generateTrainingData(dataset.id)
      toast.success('Training data generated')

      fetchDatasets()
    } catch (error) {
      console.error('Error creating dataset:', error)
      toast.error('Failed to create dataset')
    }
  }

  const handleCreateJob = async () => {
    if (!newJob.name || !newJob.dataset_id) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await submitFineTuningJob(newJob)
      toast.success('Fine-tuning job submitted successfully')
      setShowCreateJob(false)
      setNewJob({
        dataset_id: '',
        name: '',
        base_model: 'gpt-4o-mini-2024-07-18',
        hyperparameters: {
          n_epochs: 3,
        },
      })
      setEstimatedCost(null)
      fetchJobs()
    } catch (error) {
      console.error('Error creating job:', error)
      toast.error('Failed to submit fine-tuning job')
    }
  }

  const handleRefreshJob = async (jobId: string) => {
    try {
      await checkJobStatus(jobId)
      toast.success('Job status updated')
      fetchJobs()
    } catch (error) {
      console.error('Error checking job status:', error)
      toast.error('Failed to check job status')
    }
  }

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId)
      toast.success('Job cancelled')
      fetchJobs()
    } catch (error) {
      console.error('Error cancelling job:', error)
      toast.error('Failed to cancel job')
    }
  }

  const handleDeleteDataset = async (datasetId: string) => {
    try {
      await deleteDataset(datasetId)
      toast.success('Dataset deleted')
      fetchDatasets()
    } catch (error) {
      console.error('Error deleting dataset:', error)
      toast.error('Failed to delete dataset')
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteJob(jobId)
      toast.success('Job deleted')
      fetchJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error('Failed to delete job')
    }
  }

  const handleToggleModel = async (modelId: string, isActive: boolean) => {
    try {
      await toggleModelActive(modelId, !isActive)
      toast.success(isActive ? 'Model deactivated' : 'Model activated')
      fetchModels()
    } catch (error) {
      console.error('Error toggling model:', error)
      toast.error('Failed to toggle model')
    }
  }

  const handleDeleteModel = async (modelId: string) => {
    try {
      await deleteModel(modelId)
      toast.success('Model deleted')
      fetchModels()
    } catch (error) {
      console.error('Error deleting model:', error)
      toast.error('Failed to delete model')
    }
  }

  const handleExportData = async (datasetId: string) => {
    try {
      await exportTrainingData(datasetId, 'jsonl')
      toast.success('Training data exported')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export training data')
    }
  }

  const handleEstimateCost = async () => {
    if (!newJob.dataset_id) return

    try {
      const dataset = datasets.find(d => d.id === newJob.dataset_id)
      if (!dataset) return

      const cost = await estimateCost(
        newJob.base_model,
        dataset.total_examples * 100,
        (newJob.hyperparameters.n_epochs as number) || 3
      )
      setEstimatedCost(cost)
    } catch (error) {
      console.error('Error estimating cost:', error)
      toast.error('Failed to estimate cost')
    }
  }

  const handleRefreshAll = async () => {
    setRefreshing(true)
    await Promise.all([fetchDatasets(), fetchJobs(), fetchModels()])
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  if (loading && datasets.length === 0) {
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Fine-tuning Studio
            </h1>
            <p className="text-muted-foreground">
              Create custom AI models trained on your conversation data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>About Fine-tuning</AlertTitle>
          <AlertDescription>
            Fine-tuning creates a custom AI model trained on your specific conversation patterns
            and knowledge. This can improve response quality, accuracy, and consistency for your
            use case. Fine-tuning costs vary by base model and dataset size.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Training Datasets</p>
                    <p className="text-2xl font-bold">{datasets.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {datasets.filter(d => d.status === 'ready').length} ready
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                    <Database className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fine-tuning Jobs</p>
                    <p className="text-2xl font-bold">{jobs.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {jobs.filter(j => j.status === 'running').length} running
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Rocket className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Custom Models</p>
                    <p className="text-2xl font-bold">{models.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {models.filter(m => m.is_active).length} active
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="datasets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
            <TabsTrigger value="jobs">Training Jobs</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="guide">Best Practices</TabsTrigger>
          </TabsList>

          <TabsContent value="datasets" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Training Datasets</h2>
                <p className="text-sm text-muted-foreground">
                  Prepare conversation data for fine-tuning
                </p>
              </div>
              <Button onClick={() => setShowCreateDataset(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Dataset
              </Button>
            </div>

            {datasets.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Database}
                    title="No datasets yet"
                    description="Create a training dataset from your conversation history to start fine-tuning"
                    action={{
                      label: "Create Dataset",
                      onClick: () => setShowCreateDataset(true)
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Examples</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasets.map((dataset) => (
                      <TableRow key={dataset.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{dataset.name}</p>
                            {dataset.description && (
                              <p className="text-xs text-muted-foreground">{dataset.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{dataset.source_type}</TableCell>
                        <TableCell>{formatNumber(dataset.total_examples)}</TableCell>
                        <TableCell>
                          {dataset.file_size_bytes > 0
                            ? `${(dataset.file_size_bytes / 1024).toFixed(1)} KB`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[dataset.status as keyof typeof STATUS_COLORS]}>
                            {dataset.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {dataset.status === 'ready' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleExportData(dataset.id)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setNewJob({ ...newJob, dataset_id: dataset.id })
                                    setShowCreateJob(true)
                                  }}
                                >
                                  <Rocket className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDataset(dataset.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Training Jobs</h2>
                <p className="text-sm text-muted-foreground">
                  Monitor fine-tuning progress and costs
                </p>
              </div>
              {datasets.filter(d => d.status === 'ready').length > 0 && (
                <Button onClick={() => setShowCreateJob(true)}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Training
                </Button>
              )}
            </div>

            {jobs.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Rocket}
                    title="No training jobs yet"
                    description="Submit a fine-tuning job to train a custom model on your data"
                    action={
                      datasets.filter(d => d.status === 'ready').length > 0
                        ? {
                            label: "Start Training",
                            onClick: () => setShowCreateJob(true)
                          }
                        : undefined
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{job.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{job.base_model}</Badge>
                            <span>•</span>
                            <span>{format(new Date(job.created_at), 'MMM d, yyyy')}</span>
                          </CardDescription>
                        </div>
                        <Badge className={STATUS_COLORS[job.status as keyof typeof STATUS_COLORS]}>
                          {job.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(job.status === 'running' || job.status === 'queued') && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Training Progress</span>
                            <span>
                              {job.epochs > 0
                                ? `Epoch ${job.epochs}/${(job.hyperparameters as { n_epochs?: number }).n_epochs || 3}`
                                : 'Preparing...'}
                            </span>
                          </div>
                          <Progress
                            value={
                              job.epochs > 0
                                ? (job.epochs / ((job.hyperparameters as { n_epochs?: number }).n_epochs || 3)) * 100
                                : 10
                            }
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tokens Trained</p>
                          <p className="font-medium">{formatNumber(job.trained_tokens)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estimated Cost</p>
                          <p className="font-medium">{formatCurrency(job.estimated_cost_usd)}</p>
                        </div>
                        {job.actual_cost_usd > 0 && (
                          <div>
                            <p className="text-muted-foreground">Actual Cost</p>
                            <p className="font-medium">{formatCurrency(job.actual_cost_usd)}</p>
                          </div>
                        )}
                        {job.completed_at && (
                          <div>
                            <p className="text-muted-foreground">Completed</p>
                            <p className="font-medium">{format(new Date(job.completed_at), 'MMM d, HH:mm')}</p>
                          </div>
                        )}
                      </div>

                      {job.error_message && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{job.error_message}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex items-center gap-2">
                        {(job.status === 'running' || job.status === 'queued') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefreshJob(job.id)}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh Status
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelJob(job.id)}
                            >
                              <StopCircle className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {job.status === 'succeeded' && job.fine_tuned_model && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Model: {job.fine_tuned_model}
                          </Badge>
                        )}
                        {(job.status === 'failed' || job.status === 'cancelled') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Custom Models</h2>
              <p className="text-sm text-muted-foreground">
                Deploy and manage your fine-tuned models
              </p>
            </div>

            {models.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Sparkles}
                    title="No custom models yet"
                    description="Successfully completed fine-tuning jobs will appear here as deployable models"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map((model) => (
                  <Card key={model.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{model.name}</CardTitle>
                          {model.description && (
                            <CardDescription className="mt-1">{model.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant={model.is_active ? 'default' : 'secondary'}>
                          {model.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Model ID</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {model.openai_model_id}
                          </code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Base Model</span>
                          <span>{model.base_model}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total Usage</span>
                          <span>{formatNumber(model.total_usage_tokens)} tokens</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Usage Cost</span>
                          <span>{formatCurrency(model.total_usage_cost_usd)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleModel(model.id, model.is_active)}
                        >
                          {model.is_active ? (
                            <>
                              <StopCircle className="w-4 h-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteModel(model.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fine-tuning Best Practices</CardTitle>
                <CardDescription>Guidelines for creating effective fine-tuned models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Dataset Quality
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                    <li>• Use at least 50-100 high-quality examples for best results</li>
                    <li>• Include only successful conversations with high satisfaction ratings</li>
                    <li>• Ensure examples are diverse and cover different scenarios</li>
                    <li>• Remove any sensitive or personal information</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Training Configuration
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                    <li>• Start with 3 epochs, adjust based on results</li>
                    <li>• Use GPT-4o Mini for cost-effective experimentation</li>
                    <li>• Upgrade to GPT-4o for production-grade models</li>
                    <li>• Monitor training progress and costs regularly</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Cost Optimization
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                    <li>• Training costs: $3-25 per million tokens depending on base model</li>
                    <li>• Fine-tuned models have 2x higher inference costs than base models</li>
                    <li>• Start with smaller datasets to validate approach</li>
                    <li>• Export and review training data before submitting jobs</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Performance Tips
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                    <li>• Test models on a validation set before full deployment</li>
                    <li>• Compare fine-tuned vs base model performance</li>
                    <li>• Document model performance and use cases</li>
                    <li>• Retrain periodically with new conversation data</li>
                  </ul>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Need Help?</AlertTitle>
                  <AlertDescription>
                    Fine-tuning is an advanced feature. If you need assistance selecting the
                    right approach for your use case, contact our support team.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showCreateDataset} onOpenChange={setShowCreateDataset}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Training Dataset</DialogTitle>
            <DialogDescription>
              Select conversation data to prepare for fine-tuning
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dataset-name">Dataset Name</Label>
              <Input
                id="dataset-name"
                placeholder="Customer Support Conversations"
                value={newDataset.name}
                onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataset-description">Description</Label>
              <Textarea
                id="dataset-description"
                placeholder="High-quality customer support interactions with satisfaction rating 4+"
                value={newDataset.description}
                onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Source Agents</Label>
              <div className="border rounded-lg p-4 max-h-40 overflow-y-auto space-y-2">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`agent-${agent.id}`}
                      checked={newDataset.agent_ids.includes(agent.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewDataset({
                            ...newDataset,
                            agent_ids: [...newDataset.agent_ids, agent.id],
                          })
                        } else {
                          setNewDataset({
                            ...newDataset,
                            agent_ids: newDataset.agent_ids.filter((id) => id !== agent.id),
                          })
                        }
                      }}
                    />
                    <Label htmlFor={`agent-${agent.id}`} className="cursor-pointer">
                      {agent.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-start">Start Date</Label>
                <Input
                  id="date-start"
                  type="date"
                  value={newDataset.date_range_start}
                  onChange={(e) =>
                    setNewDataset({ ...newDataset, date_range_start: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-end">End Date</Label>
                <Input
                  id="date-end"
                  type="date"
                  value={newDataset.date_range_end}
                  onChange={(e) => setNewDataset({ ...newDataset, date_range_end: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Quality Filters</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="success-only"
                  checked={newDataset.filters.success_only}
                  onCheckedChange={(checked) =>
                    setNewDataset({
                      ...newDataset,
                      filters: { ...newDataset.filters, success_only: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="success-only" className="cursor-pointer">
                  Include only successful conversations
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDataset(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDataset}>
              <Database className="w-4 h-4 mr-2" />
              Create Dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Fine-tuning Job</DialogTitle>
            <DialogDescription>
              Configure and submit a fine-tuning job to OpenAI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="job-name">Job Name</Label>
              <Input
                id="job-name"
                placeholder="Customer Support Model v1"
                value={newJob.name}
                onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Training Dataset</Label>
              <Select
                value={newJob.dataset_id}
                onValueChange={(v) => {
                  setNewJob({ ...newJob, dataset_id: v })
                  setEstimatedCost(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets
                    .filter((d) => d.status === 'ready')
                    .map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id}>
                        {dataset.name} ({formatNumber(dataset.total_examples)} examples)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Base Model</Label>
              <Select
                value={newJob.base_model}
                onValueChange={(v) => {
                  setNewJob({ ...newJob, base_model: v })
                  setEstimatedCost(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{model.cost}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="epochs">Number of Epochs</Label>
              <Input
                id="epochs"
                type="number"
                min="1"
                max="10"
                value={(newJob.hyperparameters.n_epochs as number) || 3}
                onChange={(e) =>
                  setNewJob({
                    ...newJob,
                    hyperparameters: { ...newJob.hyperparameters, n_epochs: parseInt(e.target.value) },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 3 epochs for most cases
              </p>
            </div>

            {newJob.dataset_id && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleEstimateCost}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Estimate Cost
                </Button>
                {estimatedCost !== null && (
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertTitle>Estimated Training Cost</AlertTitle>
                    <AlertDescription>
                      {formatCurrency(estimatedCost)} (may vary based on actual token count)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateJob(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateJob}>
              <Rocket className="w-4 h-4 mr-2" />
              Start Training
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
