'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Clock, CheckCircle2, XCircle, MessageSquare,
  Loader2, Inbox, ChevronRight, Building2, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { TemplateApprovalDialog, statusConfig } from '@/components/agents/template-approval-dialog'
import { teamTemplateIconMap } from '@/components/agents/team-template-form-dialog'
import { useTeamTemplates, type TeamTemplate, type ApprovalHistoryEntry } from '@/hooks/use-team-templates'
import { useOrganizations, type Organization } from '@/hooks/use-organizations'
import { toast } from 'sonner'

export function TemplateReviewQueue() {
  const { organizations, currentOrganization, loading: orgsLoading } = useOrganizations()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const {
    templates, loading, fetchAllTemplates,
    approveTemplate, rejectTemplate, requestChanges, fetchApprovalHistory,
  } = useTeamTemplates(selectedOrg?.id || null)

  const [statusFilter, setStatusFilter] = useState<string>('pending_review')
  const [selectedTemplate, setSelectedTemplate] = useState<TeamTemplate | null>(null)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [history, setHistory] = useState<ApprovalHistoryEntry[]>([])
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
      fetchAllTemplates()
    }
  }, [selectedOrg, fetchAllTemplates])

  const filteredTemplates = statusFilter === 'all'
    ? templates
    : templates.filter(t => t.status === statusFilter)

  const pendingCount = templates.filter(t => t.status === 'pending_review').length

  const handleOpenReview = useCallback(async (template: TeamTemplate) => {
    setSelectedTemplate(template)
    setApprovalOpen(true)
    setHistoryLoading(true)
    try {
      const h = await fetchApprovalHistory(template.id)
      setHistory(h)
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [fetchApprovalHistory])

  const handleApprove = useCallback(async (feedback?: string) => {
    if (!selectedTemplate) return
    setActionLoading(true)
    try {
      await approveTemplate(selectedTemplate.id, feedback)
      toast.success('Template approved')
      await fetchAllTemplates()
    } catch {
      toast.error('Failed to approve template')
    } finally {
      setActionLoading(false)
    }
  }, [selectedTemplate, approveTemplate, fetchAllTemplates])

  const handleReject = useCallback(async (feedback: string) => {
    if (!selectedTemplate) return
    setActionLoading(true)
    try {
      await rejectTemplate(selectedTemplate.id, feedback)
      toast.success('Template rejected')
      await fetchAllTemplates()
    } catch {
      toast.error('Failed to reject template')
    } finally {
      setActionLoading(false)
    }
  }, [selectedTemplate, rejectTemplate, fetchAllTemplates])

  const handleRequestChanges = useCallback(async (feedback: string) => {
    if (!selectedTemplate) return
    setActionLoading(true)
    try {
      await requestChanges(selectedTemplate.id, feedback)
      toast.success('Changes requested')
      await fetchAllTemplates()
    } catch {
      toast.error('Failed to request changes')
    } finally {
      setActionLoading(false)
    }
  }, [selectedTemplate, requestChanges, fetchAllTemplates])

  const handleSubmitStub = useCallback(async () => {}, [])

  if (orgsLoading) return null
  if (organizations.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-teal-600" />
            <CardTitle className="text-base">Review Queue</CardTitle>
            {pendingCount > 0 && (
              <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/25 text-xs">
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {organizations.length > 1 && (
              <Select
                value={selectedOrg?.id || ''}
                onValueChange={(v) => {
                  const org = organizations.find(o => o.id === v)
                  if (org) setSelectedOrg(org)
                }}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <Building2 className="w-3 h-3 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <Filter className="w-3 h-3 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="changes_requested">Changes Requested</SelectItem>
                <SelectItem value="all">All Statuses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>
          Review and approve team templates before they become available to members
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && templates.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <EmptyState
            icon={statusFilter === 'pending_review' ? Inbox : Bot}
            title={statusFilter === 'pending_review' ? 'No pending reviews' : 'No templates found'}
            description={
              statusFilter === 'pending_review'
                ? 'All team templates have been reviewed'
                : `No templates with "${statusFilter.replace('_', ' ')}" status`
            }
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template) => {
                const IconComponent = teamTemplateIconMap[template.icon] || Bot
                const status = statusConfig[template.status] || statusConfig.draft
                const StatusIcon = status.icon

                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-teal-500/40 hover:bg-teal-500/[0.02] transition-all text-left group"
                      onClick={() => handleOpenReview(template)}
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500/15 to-teal-500/5 flex items-center justify-center shrink-0">
                        <IconComponent className="w-4.5 h-4.5 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{template.name}</span>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${status.color}`}>
                            <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">{template.category}</span>
                          {template.submitted_at && (
                            <>
                              <span className="text-xs text-muted-foreground">--</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(template.submitted_at), 'MMM d, h:mm a')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      <TemplateApprovalDialog
        template={selectedTemplate}
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        history={history}
        historyLoading={historyLoading}
        isAdmin={true}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestChanges={handleRequestChanges}
        onSubmitForReview={handleSubmitStub}
        actionLoading={actionLoading}
      />
    </Card>
  )
}
