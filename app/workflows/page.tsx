'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWorkflows, useWorkflowTemplates, Workflow } from '@/hooks/use-workflows'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { DemoBanner } from '@/components/dashboard/demo-banner'
import { useStore } from '@/store'
import {
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Workflow as WorkflowIcon,
  Zap,
  Clock,
  Webhook,
  FileText,
  AlertTriangle,
  UserPlus,
  Loader2,
  Lock,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

const ALLOWED_PLANS = ['pro', 'unlimited', 'enterprise']

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  draft: { color: 'text-muted-foreground', bg: 'bg-muted' },
  active: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  paused: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
  archived: { color: 'text-muted-foreground/60', bg: 'bg-muted/50' },
}

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  manual: <Play className="h-4 w-4" />,
  webhook: <Webhook className="h-4 w-4" />,
  schedule: <Clock className="h-4 w-4" />,
  event: <Zap className="h-4 w-4" />,
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  UserPlus: <UserPlus className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  Webhook: <Webhook className="h-5 w-5" />,
  AlertTriangle: <AlertTriangle className="h-5 w-5" />,
}

export default function WorkflowsPage() {
  const router = useRouter()
  const { isDemo, user } = useStore()
  const { workflows, loading, createWorkflow, deleteWorkflow, duplicateWorkflow, updateWorkflow } = useWorkflows()
  const { templates, createFromTemplate } = useWorkflowTemplates()
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState('')

  const userPlan = user?.plan || 'free'
  const hasAccess = isDemo || ALLOWED_PLANS.includes(userPlan)

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) return

    try {
      const workflow = await createWorkflow({ name: newWorkflowName })
      setCreateDialogOpen(false)
      setNewWorkflowName('')
      router.push(`/workflows/${workflow.id}`)
    } catch (error) {
      console.error('Error creating workflow:', error)
    }
  }

  const handleCreateFromTemplate = async (templateId: string, templateName: string) => {
    try {
      const workflow = await createFromTemplate(templateId, `${templateName} Workflow`)
      router.push(`/workflows/${workflow.id}`)
    } catch (error) {
      console.error('Error creating from template:', error)
    }
  }

  const handleToggleStatus = async (workflow: Workflow) => {
    const newStatus = workflow.status === 'active' ? 'paused' : 'active'
    await updateWorkflow(workflow.id, { status: newStatus })
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Upgrade to Access Workflows</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Workflow automation is available on Pro, Unlimited, and Enterprise plans.
            Automate multi-agent processes, schedule tasks, and build powerful integrations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/settings?tab=billing">
                Manage Subscription
              </Link>
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Visual Builder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Design complex workflows with a drag-and-drop interface
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Scheduled Runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automate workflows to run on schedules or triggers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-primary" />
                  Webhook Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connect workflows to external services and APIs
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {isDemo && <DemoBanner />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">AI Workflow Automation</h1>
            <p className="text-muted-foreground">
              Automate multi-agent processes with the visual workflow builder
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription>
                  Start from scratch or use a template
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Start from Scratch</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Workflow name"
                      value={newWorkflowName}
                      onChange={(e) => setNewWorkflowName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
                    />
                    <Button onClick={handleCreateWorkflow} disabled={!newWorkflowName.trim()}>
                      Create
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Or use a Template</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleCreateFromTemplate(template.id, template.name)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              {TEMPLATE_ICONS[(template.settings as any)?.icon] || <WorkflowIcon className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{template.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {template.trigger_type}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredWorkflows.length === 0 ? (
          <EmptyState
            icon={WorkflowIcon}
            title="No Workflows Yet"
            description="Create your first workflow to automate tasks, process data, and orchestrate multiple agents working together."
            action={{
              label: 'Create Your First Workflow',
              onClick: () => setCreateDialogOpen(true),
            }}
            variant="card"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow, index) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => router.push(`/workflows/${workflow.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                          <WorkflowIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={`${STATUS_STYLES[workflow.status]?.bg} ${STATUS_STYLES[workflow.status]?.color} border-0`}
                            >
                              {workflow.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/workflows/${workflow.id}`)
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleToggleStatus(workflow)
                          }}>
                            {workflow.status === 'active' ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            duplicateWorkflow(workflow.id)
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Workflow?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the
                                  workflow and all its execution history.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteWorkflow(workflow.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {workflow.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {TRIGGER_ICONS[workflow.trigger_type]}
                        <span className="capitalize">{workflow.trigger_type}</span>
                      </div>
                      <span className="text-muted-foreground/60">
                        {formatDistanceToNow(new Date(workflow.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
