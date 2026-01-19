'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gauge, Plus, Pencil, Trash2, History, Copy, AlertTriangle,
  MessageSquare, Zap, Bot, Users, Clock, Loader2, Check, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/ui/empty-state'
import { PageTransition } from '@/components/ui/page-transition'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  useAdminRateLimits,
  type PlanRateLimit,
  type CreateRateLimitData,
  type UpdateRateLimitData,
  type RateLimitAuditLog,
} from '@/hooks/use-admin-rate-limits'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const planColors: Record<string, string> = {
  free: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  pro: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  enterprise: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
}

const limitFields = [
  { key: 'messages_per_minute', label: 'Messages / Min', icon: MessageSquare, category: 'messages' },
  { key: 'messages_per_day', label: 'Messages / Day', icon: MessageSquare, category: 'messages' },
  { key: 'requests_per_minute', label: 'Requests / Min', icon: Zap, category: 'requests' },
  { key: 'requests_per_day', label: 'Requests / Day', icon: Zap, category: 'requests' },
  { key: 'tokens_per_day', label: 'Tokens / Day', icon: Clock, category: 'tokens' },
  { key: 'max_agents', label: 'Max Agents', icon: Bot, category: 'resources' },
  { key: 'agents_per_day', label: 'Agents / Day', icon: Bot, category: 'resources' },
  { key: 'max_swarms', label: 'Max Swarms', icon: Users, category: 'resources' },
  { key: 'swarms_per_day', label: 'Swarms / Day', icon: Users, category: 'resources' },
] as const

type LimitFieldKey = typeof limitFields[number]['key']

interface RateLimitFormData {
  plan: string
  messages_per_minute: number
  messages_per_day: number
  requests_per_minute: number
  requests_per_day: number
  tokens_per_day: number
  max_agents: number
  max_swarms: number
  agents_per_day: number
  swarms_per_day: number
}

const defaultFormData: RateLimitFormData = {
  plan: '',
  messages_per_minute: 10,
  messages_per_day: 1000,
  requests_per_minute: 10,
  requests_per_day: 100,
  tokens_per_day: 100000,
  max_agents: 5,
  max_swarms: 3,
  agents_per_day: 5,
  swarms_per_day: 3,
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

function RateLimitCard({
  rateLimit,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  rateLimit: PlanRateLimit
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const isDefaultPlan = ['free', 'pro', 'enterprise'].includes(rateLimit.plan)

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary/20" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`capitalize ${planColors[rateLimit.plan] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'}`}
            >
              {rateLimit.plan}
            </Badge>
            {isDefaultPlan && (
              <Badge variant="secondary" className="text-xs">
                Default
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
            </Button>
            {!isDefaultPlan && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Messages
            </p>
            <p className="text-sm font-medium">
              {formatNumber(rateLimit.messages_per_minute)}/min
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(rateLimit.messages_per_day)}/day
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Requests
            </p>
            <p className="text-sm font-medium">
              {formatNumber(rateLimit.requests_per_minute)}/min
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(rateLimit.requests_per_day)}/day
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Tokens
            </p>
            <p className="text-sm font-medium">
              {formatNumber(rateLimit.tokens_per_day)}/day
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Bot className="w-3 h-3" />
              Agents
            </p>
            <p className="text-sm font-medium">
              {rateLimit.max_agents} max
            </p>
            <p className="text-xs text-muted-foreground">
              {rateLimit.agents_per_day}/day
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              Swarms
            </p>
            <p className="text-sm font-medium">
              {rateLimit.max_swarms} max
            </p>
            <p className="text-xs text-muted-foreground">
              {rateLimit.swarms_per_day}/day
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RateLimitFormDialog({
  open,
  onOpenChange,
  rateLimit,
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rateLimit?: PlanRateLimit | null
  onSubmit: (data: RateLimitFormData) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState<RateLimitFormData>(defaultFormData)
  const isEditing = !!rateLimit

  useEffect(() => {
    if (rateLimit) {
      setFormData({
        plan: rateLimit.plan,
        messages_per_minute: rateLimit.messages_per_minute,
        messages_per_day: rateLimit.messages_per_day,
        requests_per_minute: rateLimit.requests_per_minute,
        requests_per_day: rateLimit.requests_per_day,
        tokens_per_day: rateLimit.tokens_per_day,
        max_agents: rateLimit.max_agents,
        max_swarms: rateLimit.max_swarms,
        agents_per_day: rateLimit.agents_per_day,
        swarms_per_day: rateLimit.swarms_per_day,
      })
    } else {
      setFormData(defaultFormData)
    }
  }, [rateLimit, open])

  const handleSubmit = () => {
    if (!formData.plan.trim()) {
      toast.error('Plan name is required')
      return
    }
    onSubmit(formData)
  }

  const handleNumberChange = (field: LimitFieldKey, value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      setFormData(prev => ({ ...prev, [field]: num }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Rate Limits' : 'Create Rate Limit'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Configure rate limits for the ${rateLimit.plan} plan`
              : 'Create a new rate limit configuration for a plan'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value.toLowerCase() })}
                placeholder="e.g., starter, team, business"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message Limits
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Per Minute</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.messages_per_minute}
                    onChange={(e) => handleNumberChange('messages_per_minute', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Per Day</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.messages_per_day}
                    onChange={(e) => handleNumberChange('messages_per_day', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                API Request Limits
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Per Minute</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.requests_per_minute}
                    onChange={(e) => handleNumberChange('requests_per_minute', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Per Day</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.requests_per_day}
                    onChange={(e) => handleNumberChange('requests_per_day', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Token Limits
              </h4>
              <div className="space-y-2">
                <Label className="text-xs">Per Day</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.tokens_per_day}
                  onChange={(e) => handleNumberChange('tokens_per_day', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Agent Limits
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Maximum Total</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.max_agents}
                    onChange={(e) => handleNumberChange('max_agents', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Creations Per Day</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.agents_per_day}
                    onChange={(e) => handleNumberChange('agents_per_day', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Swarm Limits
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Maximum Total</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.max_swarms}
                    onChange={(e) => handleNumberChange('max_swarms', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Creations Per Day</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.swarms_per_day}
                    onChange={(e) => handleNumberChange('swarms_per_day', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Rate Limit'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DuplicateDialog({
  open,
  onOpenChange,
  sourcePlan,
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourcePlan: string
  onSubmit: (newPlan: string) => void
  loading: boolean
}) {
  const [newPlan, setNewPlan] = useState('')

  useEffect(() => {
    if (open) {
      setNewPlan('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate Rate Limit</DialogTitle>
          <DialogDescription>
            Create a copy of the {sourcePlan} rate limits with a new plan name
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New Plan Name</Label>
            <Input
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value.toLowerCase())}
              placeholder="e.g., starter, team"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            onClick={() => onSubmit(newPlan)}
            loading={loading}
            disabled={!newPlan.trim()}
          >
            Duplicate
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AuditLogItem({ log }: { log: RateLimitAuditLog }) {
  const getActionIcon = () => {
    switch (log.action) {
      case 'create':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'update':
        return <Pencil className="w-4 h-4 text-blue-500" />
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-500" />
    }
  }

  const getActionColor = () => {
    switch (log.action) {
      case 'create':
        return 'bg-green-500/10 text-green-600'
      case 'update':
        return 'bg-blue-500/10 text-blue-600'
      case 'delete':
        return 'bg-red-500/10 text-red-600'
    }
  }

  const changedFields = Object.keys(log.new_values).filter(
    key => JSON.stringify(log.previous_values[key]) !== JSON.stringify(log.new_values[key])
  )

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <div className="mt-0.5">{getActionIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={getActionColor()}>
            {log.action}
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {log.plan}
          </Badge>
          <span className="text-xs text-muted-foreground">
            by {log.admin?.full_name || 'Unknown'}
          </span>
        </div>
        {changedFields.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            {changedFields.slice(0, 3).map((field) => (
              <div key={field} className="flex items-center gap-1">
                <span className="font-medium">{field}:</span>
                <span className="text-red-500 line-through">
                  {String(log.previous_values[field] ?? 'null')}
                </span>
                <span className="mx-1">→</span>
                <span className="text-green-500">
                  {String(log.new_values[field] ?? 'null')}
                </span>
              </div>
            ))}
            {changedFields.length > 3 && (
              <div className="text-muted-foreground">
                +{changedFields.length - 3} more changes
              </div>
            )}
          </div>
        )}
        {log.notes && (
          <p className="mt-1 text-xs text-muted-foreground italic">
            Note: {log.notes}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

export default function AdminRateLimitsPage() {
  const {
    rateLimits,
    auditLogs,
    loading,
    error,
    fetchRateLimits,
    fetchAuditLogs,
    createRateLimit,
    updateRateLimit,
    deleteRateLimit,
    duplicateRateLimit,
  } = useAdminRateLimits()

  const [formOpen, setFormOpen] = useState(false)
  const [editingLimit, setEditingLimit] = useState<PlanRateLimit | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [limitToDelete, setLimitToDelete] = useState<PlanRateLimit | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [limitToDuplicate, setLimitToDuplicate] = useState<PlanRateLimit | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('limits')

  useEffect(() => {
    fetchRateLimits()
    fetchAuditLogs()
  }, [fetchRateLimits, fetchAuditLogs])

  const handleCreate = () => {
    setEditingLimit(null)
    setFormOpen(true)
  }

  const handleEdit = (limit: PlanRateLimit) => {
    setEditingLimit(limit)
    setFormOpen(true)
  }

  const handleDelete = (limit: PlanRateLimit) => {
    setLimitToDelete(limit)
    setDeleteDialogOpen(true)
  }

  const handleDuplicate = (limit: PlanRateLimit) => {
    setLimitToDuplicate(limit)
    setDuplicateDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!limitToDelete) return

    setSubmitting(true)
    try {
      await deleteRateLimit(limitToDelete.id)
      toast.success('Rate limit deleted')
      fetchAuditLogs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setSubmitting(false)
      setDeleteDialogOpen(false)
      setLimitToDelete(null)
    }
  }

  const handleFormSubmit = async (data: RateLimitFormData) => {
    setSubmitting(true)
    try {
      if (editingLimit) {
        const updates: UpdateRateLimitData = {
          messages_per_minute: data.messages_per_minute,
          messages_per_day: data.messages_per_day,
          requests_per_minute: data.requests_per_minute,
          requests_per_day: data.requests_per_day,
          tokens_per_day: data.tokens_per_day,
          max_agents: data.max_agents,
          max_swarms: data.max_swarms,
          agents_per_day: data.agents_per_day,
          swarms_per_day: data.swarms_per_day,
        }
        await updateRateLimit(editingLimit.id, updates)
        toast.success('Rate limits updated')
      } else {
        await createRateLimit(data)
        toast.success('Rate limit created')
      }
      fetchAuditLogs()
      setFormOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDuplicateSubmit = async (newPlan: string) => {
    if (!limitToDuplicate) return

    setSubmitting(true)
    try {
      await duplicateRateLimit(limitToDuplicate.id, newPlan)
      toast.success(`Rate limit duplicated as "${newPlan}"`)
      fetchAuditLogs()
      setDuplicateDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Rate Limits</h1>
            <p className="text-muted-foreground">
              Configure rate limits for different subscription plans
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Rate Limit
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="limits" className="gap-2">
              <Gauge className="w-4 h-4" />
              Rate Limits
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="w-4 h-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="limits" className="mt-6">
            {loading && rateLimits.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : rateLimits.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Gauge}
                    title="No rate limits configured"
                    description="Create rate limit configurations for your subscription plans"
                    action={{
                      label: 'Create Rate Limit',
                      onClick: handleCreate,
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {rateLimits.map((limit) => (
                    <motion.div
                      key={limit.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <RateLimitCard
                        rateLimit={limit}
                        onEdit={() => handleEdit(limit)}
                        onDelete={() => handleDelete(limit)}
                        onDuplicate={() => handleDuplicate(limit)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan Comparison</CardTitle>
                <CardDescription>
                  Compare rate limits across all plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Limit Type</TableHead>
                        {rateLimits.map((limit) => (
                          <TableHead key={limit.id} className="text-center capitalize">
                            {limit.plan}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {limitFields.map((field) => {
                        const Icon = field.icon
                        return (
                          <TableRow key={field.key}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                {field.label}
                              </div>
                            </TableCell>
                            {rateLimits.map((limit) => (
                              <TableCell key={limit.id} className="text-center">
                                {formatNumber(limit[field.key])}
                              </TableCell>
                            ))}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change History</CardTitle>
                <CardDescription>
                  Recent changes to rate limit configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="No changes yet"
                    description="Changes to rate limits will appear here"
                  />
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 pr-4">
                      {auditLogs.map((log) => (
                        <AuditLogItem key={log.id} log={log} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <RateLimitFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          rateLimit={editingLimit}
          onSubmit={handleFormSubmit}
          loading={submitting}
        />

        <DuplicateDialog
          open={duplicateDialogOpen}
          onOpenChange={setDuplicateDialogOpen}
          sourcePlan={limitToDuplicate?.plan || ''}
          onSubmit={handleDuplicateSubmit}
          loading={submitting}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Rate Limit</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the rate limit for &quot;{limitToDelete?.plan}&quot;?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  )
}
