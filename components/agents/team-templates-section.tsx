'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Plus, Pencil, Trash2, ArrowRight, Check, Loader2,
  Users, Lock, Search, Building2, Eye, Copy, Settings2,
  Send, FileEdit, Clock, CheckCircle2, XCircle, MessageSquare,
  Inbox, Variable, GitBranch
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingButton } from '@/components/ui/loading-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TeamTemplateFormDialog, teamTemplateIconMap, type TeamTemplateFormData } from '@/components/agents/team-template-form-dialog'
import { TemplateApprovalDialog, statusConfig } from '@/components/agents/template-approval-dialog'
import { CloneWithParametersDialog } from '@/components/agents/clone-with-parameters-dialog'
import { getParametersFromSettings } from '@/lib/template-parameters'
import {
  useTeamTemplates,
  type TeamTemplate,
  type ApprovalHistoryEntry,
  type TemplateStatus,
} from '@/hooks/use-team-templates'
import { useOrganizations, type Organization } from '@/hooks/use-organizations'
import { toast } from 'sonner'

const categoryLabels: Record<string, string> = {
  all: 'All',
  research: 'Research',
  development: 'Development',
  creative: 'Creative',
  analytics: 'Analytics',
  support: 'Support',
  productivity: 'Productivity',
  business: 'Business',
  general: 'General',
}

const categoryColors: Record<string, string> = {
  research: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  development: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  creative: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  analytics: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  support: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  productivity: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  business: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  general: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
}

const permissionLabels: Record<string, { label: string; icon: React.ElementType }> = {
  view: { label: 'View Only', icon: Eye },
  use: { label: 'Clone', icon: Copy },
  edit: { label: 'Editable', icon: Settings2 },
}

function StatusBadge({ status }: { status: TemplateStatus }) {
  const config = statusConfig[status] || statusConfig.draft
  const Icon = config.icon
  return (
    <Badge variant="outline" className={`text-[10px] ${config.color}`}>
      <Icon className="w-2.5 h-2.5 mr-0.5" />
      {config.label}
    </Badge>
  )
}

function TeamTemplateCard({
  template,
  onSelect,
  canEdit,
  onEdit,
  onDelete,
  onSubmitForReview,
  onViewApproval,
  submitLoading,
}: {
  template: TeamTemplate
  onSelect: (template: TeamTemplate) => void
  canEdit: boolean
  onEdit?: (template: TeamTemplate) => void
  onDelete?: (template: TeamTemplate) => void
  onSubmitForReview?: (template: TeamTemplate) => void
  onViewApproval?: (template: TeamTemplate) => void
  submitLoading?: boolean
}) {
  const IconComponent = teamTemplateIconMap[template.icon] || Bot
  const permInfo = permissionLabels[template.permission_level] || permissionLabels.use
  const isApproved = template.status === 'approved'
  const canSubmit = template.status === 'draft' || template.status === 'changes_requested' || template.status === 'rejected'
  const canUse = isApproved && template.permission_level !== 'view'
  const paramCount = getParametersFromSettings(template.settings).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`h-full cursor-pointer hover:shadow-lg transition-all duration-200 group ${
          isApproved
            ? 'border-teal-500/30 hover:border-teal-500/50 bg-gradient-to-b from-teal-500/[0.03] to-transparent'
            : 'border-border hover:border-teal-500/30'
        }`}
        onClick={() => {
          if (isApproved) {
            onSelect(template)
          } else if (onViewApproval) {
            onViewApproval(template)
          }
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isApproved
                ? 'bg-gradient-to-br from-teal-500/20 to-teal-500/5 group-hover:from-teal-500/30 group-hover:to-teal-500/10'
                : 'bg-gradient-to-br from-slate-500/15 to-slate-500/5 group-hover:from-slate-500/20 group-hover:to-slate-500/10'
            }`}>
              <IconComponent className={`w-6 h-6 ${isApproved ? 'text-teal-600' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                <Lock className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs ${categoryColors[template.category] || categoryColors.general}`}
                >
                  {categoryLabels[template.category] || template.category}
                </Badge>
                <StatusBadge status={template.status} />
                {paramCount > 0 && (
                  <Badge variant="outline" className="text-[10px] border-teal-500/20 text-teal-600">
                    <Variable className="w-2.5 h-2.5 mr-0.5" />
                    {paramCount}
                  </Badge>
                )}
                {template.parent_template_id && (
                  <Badge variant="outline" className="text-[10px] border-sky-500/20 text-sky-600">
                    <GitBranch className="w-2.5 h-2.5 mr-0.5" />
                    {template.inheritance_mode === 'compose' ? 'composed' : 'child'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="line-clamp-2 text-sm mb-3">
            {template.description || 'No description available'}
          </CardDescription>

          {template.review_feedback && (template.status === 'changes_requested' || template.status === 'rejected') && (
            <div className={`p-2 rounded-md mb-3 text-xs ${
              template.status === 'rejected'
                ? 'bg-red-500/5 border border-red-500/20 text-red-600'
                : 'bg-orange-500/5 border border-orange-500/20 text-orange-600'
            }`}>
              <span className="font-medium">Feedback: </span>
              <span className="text-muted-foreground line-clamp-2">{template.review_feedback}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[10px] gap-0.5">
                    {(() => {
                      const PermIcon = permInfo.icon
                      return <PermIcon className="w-2.5 h-2.5" />
                    })()}
                    {permInfo.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Member permission level</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-1">
              {canEdit && canSubmit && onSubmitForReview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                  onClick={(e) => { e.stopPropagation(); onSubmitForReview(template) }}
                  disabled={submitLoading}
                >
                  <Send className="w-3 h-3" />
                  Submit
                </Button>
              )}
              {canEdit && onEdit && (template.status === 'draft' || template.status === 'changes_requested') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); onEdit(template) }}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              )}
              {canEdit && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(template) }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
              {canUse && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 group-hover:bg-teal-600 group-hover:text-white">
                  Use
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TeamTemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onUse,
  loading,
  canClone,
  allTemplates = [],
}: {
  template: TeamTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUse: () => void
  loading: boolean
  canClone: boolean
  allTemplates?: TeamTemplate[]
}) {
  if (!template) return null

  const IconComponent = teamTemplateIconMap[template.icon] || Bot
  const permInfo = permissionLabels[template.permission_level] || permissionLabels.use
  const parentTemplate = template.parent_template_id
    ? allTemplates.find(t => t.id === template.parent_template_id)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle>{template.name}</DialogTitle>
                <Badge variant="outline" className="text-[10px] border-teal-500/30 text-teal-600">
                  <Lock className="w-2.5 h-2.5 mr-0.5" />
                  Team
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={categoryColors[template.category] || categoryColors.general}
                >
                  {categoryLabels[template.category] || template.category}
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-0.5">
                  {(() => {
                    const PermIcon = permInfo.icon
                    return <PermIcon className="w-2.5 h-2.5" />
                  })()}
                  {permInfo.label}
                </Badge>
                <StatusBadge status={template.status} />
              </div>
            </div>
          </div>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {parentTemplate && (
            <div className="flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/[0.03] px-3 py-2">
              <GitBranch className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="text-xs text-muted-foreground">
                {template.inheritance_mode === 'compose' ? 'Composed with' : 'Inherits from'}{' '}
                <span className="font-medium text-foreground">{parentTemplate.name}</span>
              </span>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">Configuration</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <span className="text-muted-foreground block text-xs mb-1">Framework</span>
                <span className="font-medium">{template.framework}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <span className="text-muted-foreground block text-xs mb-1">Role</span>
                <span className="font-medium">{template.role || 'General'}</span>
              </div>
            </div>
          </div>

          {template.system_prompt && (
            <div>
              <h4 className="text-sm font-medium mb-2">System Prompt</h4>
              <ScrollArea className="h-32 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {template.system_prompt}
                </p>
              </ScrollArea>
            </div>
          )}

          {template.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {canClone && (
            <LoadingButton onClick={onUse} loading={loading}>
              <Check className="w-4 h-4 mr-2" />
              Use This Template
            </LoadingButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TeamTemplatesSection({
  onCloneSuccess,
}: {
  onCloneSuccess?: () => void
}) {
  const router = useRouter()
  const { organizations, currentOrganization, loading: orgsLoading } = useOrganizations()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const {
    templates, loading, error,
    fetchTemplates, createTemplate, updateTemplate, deleteTemplate,
    cloneToAgent, submitForReview, approveTemplate, rejectTemplate,
    requestChanges, fetchApprovalHistory,
  } = useTeamTemplates(selectedOrg?.id || null)

  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TeamTemplate | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TeamTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [cloning, setCloning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<TeamTemplate | null>(null)
  const [submitForReviewLoading, setSubmitForReviewLoading] = useState(false)

  const [paramsDialogOpen, setParamsDialogOpen] = useState(false)
  const [paramsTemplate, setParamsTemplate] = useState<TeamTemplate | null>(null)

  const [approvalTemplate, setApprovalTemplate] = useState<TeamTemplate | null>(null)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (currentOrganization) {
      setSelectedOrg(currentOrganization)
    } else if (organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0])
    }
  }, [currentOrganization, organizations, selectedOrg])

  useEffect(() => {
    if (selectedOrg) {
      fetchTemplates()
    }
  }, [selectedOrg, fetchTemplates])

  const approvedTemplates = templates.filter(t => t.status === 'approved')
  const myDrafts = templates.filter(t => t.status !== 'approved')

  const filteredApproved = searchQuery
    ? approvedTemplates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : approvedTemplates

  const filteredDrafts = searchQuery
    ? myDrafts.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : myDrafts

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormOpen(true)
  }

  const handleEdit = (template: TeamTemplate) => {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  const handleDelete = (template: TeamTemplate) => {
    setTemplateToDelete(template)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return
    try {
      await deleteTemplate(templateToDelete.id)
      toast.success('Team template deleted')
    } catch {
      toast.error('Failed to delete template')
    } finally {
      setDeleteOpen(false)
      setTemplateToDelete(null)
    }
  }

  const handleSubmit = async (data: TeamTemplateFormData & { organization_id: string }) => {
    setSubmitting(true)
    try {
      const tags = data.tags.split(',').map(t => t.trim()).filter(Boolean)
      const settings: Record<string, unknown> = {}
      if (data.parameters.length > 0) {
        settings.parameters = data.parameters
      }

      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          name: data.name,
          role: data.role || undefined,
          framework: data.framework,
          system_prompt: data.system_prompt || undefined,
          description: data.description || undefined,
          tags,
          category: data.category,
          icon: data.icon,
          permission_level: data.permission_level,
          settings,
          parent_template_id: data.parent_template_id,
          inheritance_mode: data.inheritance_mode,
          override_fields: data.override_fields,
        })
        toast.success('Team template updated')
      } else {
        await createTemplate({
          organization_id: data.organization_id,
          name: data.name,
          role: data.role || undefined,
          framework: data.framework,
          system_prompt: data.system_prompt || undefined,
          description: data.description || undefined,
          tags,
          category: data.category,
          icon: data.icon,
          permission_level: data.permission_level,
          settings,
          parent_template_id: data.parent_template_id,
          inheritance_mode: data.inheritance_mode,
          override_fields: data.override_fields,
        })
        toast.success('Team template created as draft', {
          description: 'Submit it for review to make it available to your team.',
        })
      }
      setFormOpen(false)
    } catch {
      toast.error(editingTemplate ? 'Failed to update template' : 'Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectTemplate = (template: TeamTemplate) => {
    const params = getParametersFromSettings(template.settings)
    if (params.length > 0) {
      setParamsTemplate(template)
      setParamsDialogOpen(true)
    } else {
      setSelectedTemplate(template)
      setPreviewOpen(true)
    }
  }

  const handleSubmitForReview = async (template: TeamTemplate) => {
    setSubmitForReviewLoading(true)
    try {
      await submitForReview(template.id)
      toast.success('Template submitted for review', {
        description: 'A team admin will review and approve it.',
      })
    } catch {
      toast.error('Failed to submit for review')
    } finally {
      setSubmitForReviewLoading(false)
    }
  }

  const handleViewApproval = useCallback(async (template: TeamTemplate) => {
    setApprovalTemplate(template)
    setApprovalOpen(true)
    setHistoryLoading(true)
    try {
      const h = await fetchApprovalHistory(template.id)
      setApprovalHistory(h)
    } catch {
      setApprovalHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [fetchApprovalHistory])

  const handleApprove = useCallback(async (feedback?: string) => {
    if (!approvalTemplate) return
    setActionLoading(true)
    try {
      await approveTemplate(approvalTemplate.id, feedback)
      toast.success('Template approved')
    } catch {
      toast.error('Failed to approve')
    } finally {
      setActionLoading(false)
    }
  }, [approvalTemplate, approveTemplate])

  const handleReject = useCallback(async (feedback: string) => {
    if (!approvalTemplate) return
    setActionLoading(true)
    try {
      await rejectTemplate(approvalTemplate.id, feedback)
      toast.success('Template rejected')
    } catch {
      toast.error('Failed to reject')
    } finally {
      setActionLoading(false)
    }
  }, [approvalTemplate, rejectTemplate])

  const handleRequestChanges = useCallback(async (feedback: string) => {
    if (!approvalTemplate) return
    setActionLoading(true)
    try {
      await requestChanges(approvalTemplate.id, feedback)
      toast.success('Changes requested')
    } catch {
      toast.error('Failed to request changes')
    } finally {
      setActionLoading(false)
    }
  }, [approvalTemplate, requestChanges])

  const handleApprovalSubmitForReview = useCallback(async () => {
    if (!approvalTemplate) return
    setActionLoading(true)
    try {
      await submitForReview(approvalTemplate.id)
      toast.success('Template submitted for review')
    } catch {
      toast.error('Failed to submit for review')
    } finally {
      setActionLoading(false)
    }
  }, [approvalTemplate, submitForReview])

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return
    setCloning(true)
    try {
      await cloneToAgent(selectedTemplate)
      toast.success('Agent created from team template', {
        description: `${selectedTemplate.name} has been added to your agents.`,
      })
      setPreviewOpen(false)
      onCloneSuccess?.()
    } catch (err) {
      toast.error('Failed to create agent', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setCloning(false)
    }
  }

  const handleCloneWithParams = async (parameterValues: Record<string, string | number | boolean>) => {
    if (!paramsTemplate) return
    setCloning(true)
    try {
      await cloneToAgent(paramsTemplate, parameterValues)
      toast.success('Agent created from team template', {
        description: `${paramsTemplate.name} has been customized and added to your agents.`,
      })
      setParamsDialogOpen(false)
      setParamsTemplate(null)
      onCloneSuccess?.()
    } catch (err) {
      toast.error('Failed to create agent', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setCloning(false)
    }
  }

  if (orgsLoading) return null
  if (organizations.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold">Team Templates</h2>
          {organizations.length > 1 && (
            <Select
              value={selectedOrg?.id || ''}
              onValueChange={(v) => {
                const org = organizations.find(o => o.id === v)
                if (org) setSelectedOrg(org)
              }}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {organizations.length === 1 && selectedOrg && (
            <Badge variant="outline" className="text-xs border-teal-500/30 text-teal-600">
              {selectedOrg.name}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={handleCreate} className="border-teal-500/30 text-teal-600 hover:bg-teal-500/10">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Team Template
        </Button>
      </div>

      {loading && templates.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed border-teal-500/30">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="w-10 h-10 text-teal-500/40 mb-3" />
            <p className="text-sm font-medium mb-1">No team templates yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Create private templates to share with your team members
            </p>
            <Button size="sm" variant="outline" onClick={handleCreate} className="border-teal-500/30 text-teal-600 hover:bg-teal-500/10">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {templates.length > 4 && (
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search team templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          )}

          {filteredDrafts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileEdit className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Your Drafts & In Review</h3>
                <Badge variant="secondary" className="text-[10px]">{filteredDrafts.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredDrafts.map((template) => (
                    <TeamTemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleSelectTemplate}
                      canEdit={true}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onSubmitForReview={handleSubmitForReview}
                      onViewApproval={handleViewApproval}
                      submitLoading={submitForReviewLoading}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {filteredApproved.length > 0 && (
            <div>
              {filteredDrafts.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-medium text-muted-foreground">Approved Templates</h3>
                  <Badge variant="secondary" className="text-[10px]">{filteredApproved.length}</Badge>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredApproved.map((template) => (
                    <TeamTemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleSelectTemplate}
                      canEdit={true}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onViewApproval={handleViewApproval}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {filteredApproved.length === 0 && filteredDrafts.length === 0 && searchQuery && (
            <EmptyState
              icon={Search}
              title="No matching templates"
              description={`No team templates match "${searchQuery}"`}
              action={{ label: 'Clear Search', onClick: () => setSearchQuery('') }}
            />
          )}
        </div>
      )}

      {selectedOrg && (
        <TeamTemplateFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          template={editingTemplate}
          organizationId={selectedOrg.id}
          allTemplates={templates}
          onSubmit={handleSubmit}
          loading={submitting}
        />
      )}

      <TeamTemplatePreviewDialog
        template={selectedTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUse={handleUseTemplate}
        loading={cloning}
        canClone={selectedTemplate?.permission_level !== 'view' && selectedTemplate?.status === 'approved'}
        allTemplates={templates}
      />

      <CloneWithParametersDialog
        template={paramsTemplate}
        open={paramsDialogOpen}
        onOpenChange={(open) => {
          setParamsDialogOpen(open)
          if (!open) setParamsTemplate(null)
        }}
        onClone={handleCloneWithParams}
        loading={cloning}
      />

      <TemplateApprovalDialog
        template={approvalTemplate}
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        history={approvalHistory}
        historyLoading={historyLoading}
        isAdmin={false}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestChanges={handleRequestChanges}
        onSubmitForReview={handleApprovalSubmitForReview}
        actionLoading={actionLoading}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This will remove it for all team members.
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
    </div>
  )
}
