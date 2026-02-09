'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Bot, CheckCircle2, XCircle, MessageSquare, Clock,
  FileEdit, Send, History, ChevronRight, FlaskConical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { LoadingButton } from '@/components/ui/loading-button'
import { teamTemplateIconMap } from '@/components/agents/team-template-form-dialog'
import type { TeamTemplate, ApprovalHistoryEntry, TemplateStatus } from '@/hooks/use-team-templates'

const statusConfig: Record<TemplateStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: FileEdit },
  pending_review: { label: 'Pending Review', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
  changes_requested: { label: 'Changes Requested', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: MessageSquare },
}

export { statusConfig }

const actionLabels: Record<string, { label: string; color: string }> = {
  draft_created: { label: 'Created as draft', color: 'text-slate-500' },
  submitted: { label: 'Submitted for review', color: 'text-amber-600' },
  resubmitted: { label: 'Resubmitted for review', color: 'text-amber-600' },
  approved: { label: 'Approved', color: 'text-emerald-600' },
  rejected: { label: 'Rejected', color: 'text-red-600' },
  changes_requested: { label: 'Changes requested', color: 'text-orange-600' },
}

function ApprovalTimeline({ history }: { history: ApprovalHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">No approval history</p>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((entry, index) => {
        const actionInfo = actionLabels[entry.action] || { label: entry.action, color: 'text-muted-foreground' }
        return (
          <div key={entry.id} className="relative pl-6">
            {index < history.length - 1 && (
              <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
            )}
            <div className="absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full border-2 border-background bg-muted flex items-center justify-center">
              <div className={`w-2 h-2 rounded-full ${
                entry.action === 'approved' ? 'bg-emerald-500' :
                entry.action === 'rejected' ? 'bg-red-500' :
                entry.action === 'changes_requested' ? 'bg-orange-500' :
                entry.action === 'submitted' || entry.action === 'resubmitted' ? 'bg-amber-500' :
                'bg-slate-400'
              }`} />
            </div>
            <div className="pb-3">
              <p className={`text-sm font-medium ${actionInfo.color}`}>
                {actionInfo.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
              </p>
              {entry.feedback && (
                <div className="mt-1.5 p-2 rounded-md bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{entry.feedback}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function TemplateApprovalDialog({
  template,
  open,
  onOpenChange,
  history,
  historyLoading,
  isAdmin,
  onApprove,
  onReject,
  onRequestChanges,
  onSubmitForReview,
  onTest,
  actionLoading,
}: {
  template: TeamTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  history: ApprovalHistoryEntry[]
  historyLoading: boolean
  isAdmin: boolean
  onApprove: (feedback?: string) => Promise<void>
  onReject: (feedback: string) => Promise<void>
  onRequestChanges: (feedback: string) => Promise<void>
  onSubmitForReview: () => Promise<void>
  onTest?: (template: TeamTemplate) => void
  actionLoading: boolean
}) {
  const [feedback, setFeedback] = useState('')
  const [activeAction, setActiveAction] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setFeedback('')
      setActiveAction(null)
    }
  }, [open])

  if (!template) return null

  const IconComponent = teamTemplateIconMap[template.icon] || Bot
  const status = statusConfig[template.status] || statusConfig.draft
  const StatusIcon = status.icon

  const canSubmit = template.status === 'draft' || template.status === 'changes_requested' || template.status === 'rejected'
  const canReview = isAdmin && template.status === 'pending_review'

  const handleAction = async (action: string) => {
    setActiveAction(action)
    try {
      if (action === 'approve') {
        await onApprove(feedback || undefined)
      } else if (action === 'reject') {
        if (!feedback.trim()) return
        await onReject(feedback)
      } else if (action === 'request_changes') {
        if (!feedback.trim()) return
        await onRequestChanges(feedback)
      } else if (action === 'submit') {
        await onSubmitForReview()
      }
      onOpenChange(false)
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base">{template.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                  <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                  {status.label}
                </Badge>
                {template.submitted_at && (
                  <span className="text-[10px] text-muted-foreground">
                    Submitted {format(new Date(template.submitted_at), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogDescription className="line-clamp-2">
            {template.description || 'No description'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {template.review_feedback && (template.status === 'rejected' || template.status === 'changes_requested') && (
            <div className={`p-3 rounded-lg border ${
              template.status === 'rejected'
                ? 'bg-red-500/5 border-red-500/20'
                : 'bg-orange-500/5 border-orange-500/20'
            }`}>
              <p className={`text-xs font-medium mb-1 ${
                template.status === 'rejected' ? 'text-red-600' : 'text-orange-600'
              }`}>
                Reviewer Feedback
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {template.review_feedback}
              </p>
            </div>
          )}

          {template.system_prompt && (
            <div>
              <h4 className="text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">System Prompt</h4>
              <ScrollArea className="h-24 rounded-md border bg-muted/30 p-2">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{template.system_prompt}</p>
              </ScrollArea>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-muted/50 rounded-md p-2">
              <span className="text-muted-foreground block mb-0.5">Framework</span>
              <span className="font-medium">{template.framework}</span>
            </div>
            <div className="bg-muted/50 rounded-md p-2">
              <span className="text-muted-foreground block mb-0.5">Category</span>
              <span className="font-medium capitalize">{template.category}</span>
            </div>
            <div className="bg-muted/50 rounded-md p-2">
              <span className="text-muted-foreground block mb-0.5">Role</span>
              <span className="font-medium">{template.role || 'General'}</span>
            </div>
          </div>

          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}

          <Separator />

          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approval History</h4>
            </div>
            {historyLoading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
            ) : (
              <ApprovalTimeline history={history} />
            )}
          </div>

          {onTest && template && (
            <>
              <Separator />
              <Button
                variant="outline"
                size="sm"
                className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                onClick={() => onTest(template)}
              >
                <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
                Test Template in Sandbox
              </Button>
            </>
          )}

          {(canReview || canSubmit) && (
            <>
              <Separator />
              <div className="space-y-3">
                {canReview && (
                  <div className="space-y-2">
                    <Label className="text-xs">Review Feedback (required for reject / request changes)</Label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide feedback for the template creator..."
                      rows={3}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <LoadingButton
                        size="sm"
                        onClick={() => handleAction('approve')}
                        loading={actionLoading && activeAction === 'approve'}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Approve
                      </LoadingButton>
                      <LoadingButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('request_changes')}
                        loading={actionLoading && activeAction === 'request_changes'}
                        disabled={actionLoading || !feedback.trim()}
                        className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        Request Changes
                      </LoadingButton>
                      <LoadingButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('reject')}
                        loading={actionLoading && activeAction === 'reject'}
                        disabled={actionLoading || !feedback.trim()}
                        className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Reject
                      </LoadingButton>
                    </div>
                  </div>
                )}

                {canSubmit && !isAdmin && (
                  <LoadingButton
                    size="sm"
                    onClick={() => handleAction('submit')}
                    loading={actionLoading && activeAction === 'submit'}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {template.status === 'draft' ? 'Submit for Review' : 'Resubmit for Review'}
                  </LoadingButton>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
