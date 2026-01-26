'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Plus, Pencil, Trash2, Power, PowerOff, GripVertical,
  Code, PenTool, BarChart, Headphones, TrendingUp,
  FileText, Shield, Layout, Kanban, Brain, Cpu, Server, Search, Loader2,
  GraduationCap, Target, Globe, FlaskConical, History, GitMerge, BarChart3,
  ChevronLeft, Sparkles, Tag, RotateCcw, ArrowUpCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { PageTransition } from '@/components/ui/page-transition'
import { LoadingButton } from '@/components/ui/loading-button'
import { useDefaultAgents, type DefaultAgent, type CreateTemplateData } from '@/hooks/use-default-agents'
import { toast } from 'sonner'

const iconOptions = [
  { value: 'Bot', label: 'Bot', icon: Bot },
  { value: 'Brain', label: 'Brain', icon: Brain },
  { value: 'Code', label: 'Code', icon: Code },
  { value: 'PenTool', label: 'Pen Tool', icon: PenTool },
  { value: 'BarChart', label: 'Bar Chart', icon: BarChart },
  { value: 'BarChart3', label: 'Analytics', icon: BarChart3 },
  { value: 'Headphones', label: 'Headphones', icon: Headphones },
  { value: 'TrendingUp', label: 'Trending Up', icon: TrendingUp },
  { value: 'FileText', label: 'File Text', icon: FileText },
  { value: 'Shield', label: 'Shield', icon: Shield },
  { value: 'Layout', label: 'Layout', icon: Layout },
  { value: 'Kanban', label: 'Kanban', icon: Kanban },
  { value: 'Cpu', label: 'CPU', icon: Cpu },
  { value: 'Server', label: 'Server', icon: Server },
  { value: 'Search', label: 'Search', icon: Search },
  { value: 'GraduationCap', label: 'Academic', icon: GraduationCap },
  { value: 'Target', label: 'Target', icon: Target },
  { value: 'Globe', label: 'Globe', icon: Globe },
  { value: 'FlaskConical', label: 'Science', icon: FlaskConical },
  { value: 'History', label: 'History', icon: History },
  { value: 'GitMerge', label: 'Synthesis', icon: GitMerge },
]

const iconMap: Record<string, React.ElementType> = Object.fromEntries(
  iconOptions.map((opt) => [opt.value, opt.icon])
)

const categoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'research', label: 'Research' },
  { value: 'development', label: 'Development' },
  { value: 'creative', label: 'Creative' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'support', label: 'Support' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'business', label: 'Business' },
]

const frameworkOptions = [
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'openai', label: 'OpenAI GPT' },
  { value: 'langchain', label: 'LangChain' },
  { value: 'autogen', label: 'AutoGen' },
  { value: 'crewai', label: 'CrewAI' },
  { value: 'custom', label: 'Custom' },
]

interface TemplateFormData {
  name: string
  role: string
  framework: string
  system_prompt: string
  description: string
  tags: string
  category: string
  icon: string
  version: string
  changelog: string
}

const defaultFormData: TemplateFormData = {
  name: '',
  role: '',
  framework: 'anthropic',
  system_prompt: '',
  description: '',
  tags: '',
  category: 'general',
  icon: 'Bot',
  version: '1.0.0',
  changelog: 'Initial release',
}

function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: DefaultAgent | null
  onSubmit: (data: TemplateFormData) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState<TemplateFormData>(defaultFormData)

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        role: template.role || '',
        framework: template.framework,
        system_prompt: template.system_prompt || '',
        description: template.description || '',
        tags: template.tags.join(', '),
        category: template.category,
        icon: template.icon,
        version: template.version || '1.0.0',
        changelog: template.changelog || '',
      })
    } else {
      setFormData(defaultFormData)
    }
  }, [template, open])

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    onSubmit(formData)
  }

  const IconComponent = iconMap[formData.icon] || Bot

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            {template
              ? 'Update the template configuration'
              : 'Create a new agent template for users to clone'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Research Assistant"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., researcher"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Framework</Label>
              <Select
                value={formData.framework}
                onValueChange={(value) => setFormData({ ...formData, framework: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frameworkOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <Select
              value={formData.icon}
              onValueChange={(value) => setFormData({ ...formData, icon: value })}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    {iconOptions.find((opt) => opt.value === formData.icon)?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this agent does..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>System Prompt</Label>
            <Textarea
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              placeholder="Define the agent's behavior and capabilities..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., research, analysis, academic"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Version
              </Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="e.g., 1.0.0"
              />
              <p className="text-xs text-muted-foreground">
                Semantic versioning (major.minor.patch)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Changelog</Label>
              <Textarea
                value={formData.changelog}
                onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
                placeholder="What changed in this version..."
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton onClick={handleSubmit} loading={loading}>
            {template ? 'Save Changes' : 'Create Template'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminTemplatesPage() {
  const router = useRouter()
  const {
    templates,
    loading,
    error,
    fetchAllTemplates,
    createTemplate,
    updateTemplate,
    toggleTemplateActive,
    deleteTemplate,
    getVersionHistory,
    rollbackTemplate,
  } = useDefaultAgents()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DefaultAgent | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<DefaultAgent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [versionHistory, setVersionHistory] = useState<DefaultAgent[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedHistoryTemplate, setSelectedHistoryTemplate] = useState<DefaultAgent | null>(null)
  const [rollingBack, setRollingBack] = useState(false)

  useEffect(() => {
    fetchAllTemplates()
  }, [fetchAllTemplates])

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormOpen(true)
  }

  const handleEdit = (template: DefaultAgent) => {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  const handleDelete = (template: DefaultAgent) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    setDeletingId(templateToDelete.id)
    try {
      await deleteTemplate(templateToDelete.id)
      toast.success('Template deleted')
    } catch (err) {
      toast.error('Failed to delete template')
    } finally {
      setDeletingId(null)
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
    }
  }

  const handleToggleActive = async (template: DefaultAgent) => {
    setTogglingIds((prev) => new Set(prev).add(template.id))
    try {
      await toggleTemplateActive(template.id, !template.is_active)
      toast.success(template.is_active ? 'Template deactivated' : 'Template activated')
    } catch (err) {
      toast.error('Failed to update template')
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(template.id)
        return next
      })
    }
  }

  const handleSubmit = async (data: TemplateFormData) => {
    setSubmitting(true)
    try {
      const tags = data.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const templateData: CreateTemplateData = {
        name: data.name,
        role: data.role || undefined,
        framework: data.framework,
        system_prompt: data.system_prompt || undefined,
        description: data.description || undefined,
        tags,
        category: data.category,
        icon: data.icon,
        version: data.version || '1.0.0',
        changelog: data.changelog || undefined,
      }

      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, templateData)
        toast.success('Template updated')
      } else {
        await createTemplate(templateData)
        toast.success('Template created')
      }
      setFormOpen(false)
    } catch (err) {
      toast.error(editingTemplate ? 'Failed to update template' : 'Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewHistory = async (template: DefaultAgent) => {
    setSelectedHistoryTemplate(template)
    setLoadingHistory(true)
    setHistoryDialogOpen(true)
    try {
      const history = await getVersionHistory(template.id)
      setVersionHistory(history)
    } catch (err) {
      toast.error('Failed to load version history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleRollback = async (template: DefaultAgent) => {
    if (!template.previous_version_id) {
      toast.error('No previous version available')
      return
    }

    setRollingBack(true)
    try {
      await rollbackTemplate(template.id)
      toast.success('Template rolled back successfully')
      setHistoryDialogOpen(false)
    } catch (err) {
      toast.error('Failed to rollback template')
    } finally {
      setRollingBack(false)
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin/agents')}
              className="shrink-0 mt-0.5"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Agent Templates
              </h1>
              <p className="text-muted-foreground">
                Manage {templates.length} default agent templates available to users
              </p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Templates ({templates.length})</CardTitle>
            <CardDescription>
              Templates users can clone to quickly create pre-configured agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && templates.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="No templates yet"
                description="Create your first agent template"
                action={{
                  label: 'Create Template',
                  onClick: handleCreate,
                }}
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Framework</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="w-[100px] text-center">Status</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {templates.map((template) => {
                        const IconComponent = iconMap[template.icon] || Bot
                        return (
                          <motion.tr
                            key={template.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="group"
                          >
                            <TableCell>
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <IconComponent className="w-4 h-4 text-primary" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{template.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                  {template.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {template.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="font-mono text-xs">
                                  v{template.version || '1.0.0'}
                                </Badge>
                                {template.previous_version_id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleViewHistory(template)}
                                    title="View version history"
                                  >
                                    <History className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{template.framework}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {template.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {template.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{template.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {togglingIds.has(template.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                              ) : (
                                <Switch
                                  checked={template.is_active}
                                  onCheckedChange={() => handleToggleActive(template)}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(template)}
                                  title="Edit template"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleViewHistory(template)}
                                  title="Version history"
                                >
                                  <History className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(template)}
                                  disabled={deletingId === template.id}
                                  title="Delete template"
                                >
                                  {deletingId === template.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <TemplateFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          template={editingTemplate}
          onSubmit={handleSubmit}
          loading={submitting}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Version History
              </DialogTitle>
              <DialogDescription>
                {selectedHistoryTemplate?.name} - View past versions and rollback if needed
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : versionHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No version history available
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {versionHistory.map((version, index) => (
                    <div
                      key={version.id}
                      className={`p-4 rounded-lg border ${
                        index === 0 ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={index === 0 ? 'default' : 'outline'}
                            className="font-mono"
                          >
                            v{version.version}
                          </Badge>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(version.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {version.changelog || 'No changelog provided'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
                Close
              </Button>
              {selectedHistoryTemplate?.previous_version_id && (
                <LoadingButton
                  variant="destructive"
                  onClick={() => selectedHistoryTemplate && handleRollback(selectedHistoryTemplate)}
                  loading={rollingBack}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Rollback to Previous
                </LoadingButton>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}
