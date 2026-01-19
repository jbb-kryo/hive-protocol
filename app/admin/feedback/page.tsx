'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bug, Lightbulb, HelpCircle, MoreHorizontal, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, Download, Eye, MessageSquare, TrendingUp, TrendingDown, Minus, ExternalLink, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Feedback {
  id: string
  user_id: string | null
  type: 'bug' | 'feature' | 'question' | 'other'
  subject: string
  message: string
  screenshot_url: string | null
  status: 'new' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  admin_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
  page_url: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
  profiles?: { email: string; full_name: string | null } | null
}

interface NPSResponse {
  id: string
  user_id: string
  score: number
  comment: string | null
  trigger: string
  created_at: string
  profiles?: { email: string; full_name: string | null } | null
}

interface FeedbackStats {
  total: number
  new: number
  in_progress: number
  resolved: number
  byType: Record<string, number>
  npsAverage: number
  npsCount: number
  promoters: number
  passives: number
  detractors: number
}

const typeIcons = {
  bug: Bug,
  feature: Lightbulb,
  question: HelpCircle,
  other: MoreHorizontal,
}

const statusIcons = {
  new: Clock,
  in_progress: AlertCircle,
  resolved: CheckCircle,
  closed: XCircle,
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

export default function AdminFeedbackPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [npsResponses, setNpsResponses] = useState<NPSResponse[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user?.role === 'admin') {
      fetchFeedback()
      fetchNPSResponses()
    }
  }, [user])

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false })

      if (error) throw error

      setFeedback(data || [])
      calculateStats(data || [], npsResponses)
    } catch {
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const fetchNPSResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('nps_responses')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false })

      if (error) throw error

      setNpsResponses(data || [])
      calculateStats(feedback, data || [])
    } catch {
      toast.error('Failed to load NPS responses')
    }
  }

  const calculateStats = (feedbackData: Feedback[], npsData: NPSResponse[]) => {
    const byStatus = feedbackData.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byType = feedbackData.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const promoters = npsData.filter(r => r.score >= 9).length
    const passives = npsData.filter(r => r.score >= 7 && r.score <= 8).length
    const detractors = npsData.filter(r => r.score <= 6).length
    const npsScore = npsData.length > 0
      ? Math.round(((promoters - detractors) / npsData.length) * 100)
      : 0

    setStats({
      total: feedbackData.length,
      new: byStatus['new'] || 0,
      in_progress: byStatus['in_progress'] || 0,
      resolved: byStatus['resolved'] || 0,
      byType,
      npsAverage: npsScore,
      npsCount: npsData.length,
      promoters,
      passives,
      detractors,
    })
  }

  const updateFeedbackStatus = async (id: string, status: string) => {
    try {
      const updates: Record<string, unknown> = { status }
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString()
        updates.resolved_by = user?.id
      }

      const { error } = await supabase
        .from('feedback')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      toast.success('Status updated')
      fetchFeedback()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const updateFeedbackPriority = async (id: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ priority })
        .eq('id', id)

      if (error) throw error

      toast.success('Priority updated')
      fetchFeedback()
    } catch {
      toast.error('Failed to update priority')
    }
  }

  const saveAdminNotes = async () => {
    if (!selectedFeedback) return

    try {
      const { error } = await supabase
        .from('feedback')
        .update({ admin_notes: adminNotes })
        .eq('id', selectedFeedback.id)

      if (error) throw error

      toast.success('Notes saved')
      fetchFeedback()
    } catch {
      toast.error('Failed to save notes')
    }
  }

  const exportFeedback = () => {
    const csv = [
      ['ID', 'Type', 'Subject', 'Message', 'Status', 'Priority', 'User', 'Created At'].join(','),
      ...feedback.map(f => [
        f.id,
        f.type,
        `"${f.subject.replace(/"/g, '""')}"`,
        `"${f.message.replace(/"/g, '""')}"`,
        f.status,
        f.priority,
        f.profiles?.email || 'Anonymous',
        format(new Date(f.created_at), 'yyyy-MM-dd HH:mm'),
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const filteredFeedback = feedback.filter(f => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false
    if (filterType !== 'all' && f.type !== filterType) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        f.subject.toLowerCase().includes(query) ||
        f.message.toLowerCase().includes(query) ||
        f.profiles?.email?.toLowerCase().includes(query)
      )
    }
    return true
  })

  if (authLoading || loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!user || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback Management</h1>
          <p className="text-muted-foreground">Review and manage user feedback and NPS responses</p>
        </div>
        <Button onClick={exportFeedback} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Feedback</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.new || 0} new, {stats?.in_progress || 0} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>NPS Score</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {stats?.npsAverage || 0}
              {stats?.npsAverage !== undefined && (
                stats.npsAverage > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : stats.npsAverage < 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <Minus className="h-5 w-5 text-gray-500" />
                )
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Based on {stats?.npsCount || 0} responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bugs Reported</CardDescription>
            <CardTitle className="text-3xl">{stats?.byType?.bug || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.byType?.feature || 0} feature requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolution Rate</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.total ? Math.round((stats.resolved / stats.total) * 100) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.resolved || 0} resolved
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="feedback">
        <TabsList>
          <TabsTrigger value="feedback">Feedback ({feedback.length})</TabsTrigger>
          <TabsTrigger value="nps">NPS Responses ({npsResponses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No feedback found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeedback.map((item) => {
                    const TypeIcon = typeIcons[item.type]
                    const StatusIcon = statusIcons[item.status]
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4" />
                            <span className="capitalize">{item.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{item.subject}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.message}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{item.profiles?.email || 'Anonymous'}</span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Badge variant="secondary" className={statusColors[item.status]}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {item.status.replace('_', ' ')}
                                </Badge>
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => updateFeedbackStatus(item.id, 'new')}>
                                New
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateFeedbackStatus(item.id, 'in_progress')}>
                                In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateFeedbackStatus(item.id, 'resolved')}>
                                Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateFeedbackStatus(item.id, 'closed')}>
                                Closed
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Badge variant="secondary" className={priorityColors[item.priority]}>
                                  {item.priority}
                                </Badge>
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => updateFeedbackPriority(item.id, 'low')}>
                                Low
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateFeedbackPriority(item.id, 'medium')}>
                                Medium
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateFeedbackPriority(item.id, 'high')}>
                                High
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateFeedbackPriority(item.id, 'critical')}>
                                Critical
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(item.created_at), 'MMM d, yyyy')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFeedback(item)
                              setAdminNotes(item.admin_notes || '')
                              setDetailsOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="nps" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader className="pb-2">
                <CardDescription>Promoters (9-10)</CardDescription>
                <CardTitle className="text-2xl text-green-600">{stats?.promoters || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-yellow-200 dark:border-yellow-900">
              <CardHeader className="pb-2">
                <CardDescription>Passives (7-8)</CardDescription>
                <CardTitle className="text-2xl text-yellow-600">{stats?.passives || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardDescription>Detractors (0-6)</CardDescription>
                <CardTitle className="text-2xl text-red-600">{stats?.detractors || 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Score</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {npsResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No NPS responses yet
                    </TableCell>
                  </TableRow>
                ) : (
                  npsResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <span className={`text-lg font-bold ${
                          response.score >= 9 ? 'text-green-600' :
                          response.score >= 7 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {response.score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          response.score >= 9 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          response.score >= 7 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }>
                          {response.score >= 9 ? 'Promoter' : response.score >= 7 ? 'Passive' : 'Detractor'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[300px] truncate text-sm">
                          {response.comment || <span className="text-muted-foreground">No comment</span>}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{response.profiles?.email || 'Unknown'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(response.created_at), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {(() => {
                    const TypeIcon = typeIcons[selectedFeedback.type]
                    return <TypeIcon className="h-5 w-5" />
                  })()}
                  <DialogTitle>{selectedFeedback.subject}</DialogTitle>
                </div>
                <DialogDescription>
                  Submitted by {selectedFeedback.profiles?.email || 'Anonymous'} on{' '}
                  {format(new Date(selectedFeedback.created_at), 'PPpp')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="secondary" className={statusColors[selectedFeedback.status]}>
                    {selectedFeedback.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="secondary" className={priorityColors[selectedFeedback.priority]}>
                    {selectedFeedback.priority} priority
                  </Badge>
                  <Badge variant="outline">{selectedFeedback.type}</Badge>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Message</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>

                {selectedFeedback.screenshot_url && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Screenshot</Label>
                    <a
                      href={selectedFeedback.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-2 text-primary hover:underline"
                    >
                      <Image className="h-4 w-4" />
                      View Screenshot
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {selectedFeedback.page_url && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Page URL</Label>
                    <a
                      href={selectedFeedback.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-2 text-primary hover:underline text-sm"
                    >
                      {selectedFeedback.page_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <div>
                  <Label htmlFor="admin-notes">Admin Notes</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this feedback..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
                <Button onClick={saveAdminNotes}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Save Notes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
