'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Hexagon,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  User,
  Loader2,
  Bot,
  MessageSquare,
  Eye,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useAdminAI, type AdminSwarm, type Pagination } from '@/hooks/use-admin-ai'
import { useAdminUsers } from '@/hooks/use-admin-users'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function AdminSwarmsPage() {
  const {
    listAllSwarms,
    updateSwarm,
    deleteSwarm,
    duplicateSwarm,
    transferSwarm,
  } = useAdminAI()
  const { fetchUsers } = useAdminUsers()
  const { toast } = useToast()

  const [swarms, setSwarms] = useState<AdminSwarm[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingSwarm, setEditingSwarm] = useState<AdminSwarm | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    task: '',
    status: 'active',
    visibility: 'private',
    allow_guest_messages: false,
  })

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingSwarm, setDeletingSwarm] = useState<AdminSwarm | null>(null)

  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferringSwarm, setTransferringSwarm] = useState<AdminSwarm | null>(null)
  const [transferUserId, setTransferUserId] = useState('')
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [saving, setSaving] = useState(false)

  const loadSwarms = useCallback(async (page: number = 1, searchTerm?: string, status?: string) => {
    try {
      setLoading(true)
      const data = await listAllSwarms({
        page,
        limit: 20,
        search: searchTerm !== undefined ? searchTerm : search,
        status: (status !== undefined ? status : statusFilter) || undefined,
      })
      setSwarms(data.swarms)
      setPagination(data.pagination)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load swarms',
      })
    } finally {
      setLoading(false)
    }
  }, [listAllSwarms, search, statusFilter, toast])

  useEffect(() => {
    loadSwarms(1)
  }, [])

  const handleSearch = () => {
    setSearch(searchInput)
    loadSwarms(1, searchInput, statusFilter)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    loadSwarms(1, search, status)
  }

  const handlePageChange = (page: number) => {
    loadSwarms(page)
  }

  const openEditDialog = (swarm: AdminSwarm) => {
    setEditingSwarm(swarm)
    setEditForm({
      name: swarm.name,
      task: swarm.task || '',
      status: swarm.status,
      visibility: swarm.visibility,
      allow_guest_messages: false,
    })
    setEditDialogOpen(true)
  }

  const handleSaveSwarm = async () => {
    if (!editingSwarm) return
    try {
      setSaving(true)
      await updateSwarm(editingSwarm.id, editForm)
      toast({ title: 'Swarm updated' })
      setEditDialogOpen(false)
      loadSwarms(pagination.page)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update swarm',
      })
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (swarm: AdminSwarm) => {
    setDeletingSwarm(swarm)
    setDeleteDialogOpen(true)
  }

  const handleDeleteSwarm = async () => {
    if (!deletingSwarm) return
    try {
      setSaving(true)
      await deleteSwarm(deletingSwarm.id)
      toast({ title: 'Swarm deleted' })
      setDeleteDialogOpen(false)
      loadSwarms(pagination.page)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete swarm',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async (swarm: AdminSwarm) => {
    try {
      await duplicateSwarm(swarm.id)
      toast({ title: 'Swarm duplicated' })
      loadSwarms(pagination.page)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to duplicate swarm',
      })
    }
  }

  const openTransferDialog = async (swarm: AdminSwarm) => {
    setTransferringSwarm(swarm)
    setTransferUserId('')
    setTransferDialogOpen(true)

    try {
      setLoadingUsers(true)
      const data = await fetchUsers(1, { limit: 100 } as any)
      setUsers(data.users.filter((u: any) => u.id !== swarm.user_id))
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users',
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleTransfer = async () => {
    if (!transferringSwarm || !transferUserId) return
    try {
      setSaving(true)
      await transferSwarm(transferringSwarm.id, transferUserId)
      toast({ title: 'Swarm transferred' })
      setTransferDialogOpen(false)
      loadSwarms(pagination.page)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to transfer swarm',
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-600">Active</Badge>
      case 'paused':
        return <Badge className="bg-amber-500/20 text-amber-600">Paused</Badge>
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-600">Completed</Badge>
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Badge variant="outline" className="text-emerald-600 border-emerald-600/30">Public</Badge>
      case 'shared':
        return <Badge variant="outline" className="text-blue-600 border-blue-600/30">Shared</Badge>
      default:
        return <Badge variant="outline">Private</Badge>
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All Swarms</h1>
          <p className="text-muted-foreground">
            {pagination.total} swarms across all users
          </p>
        </div>
        <Button onClick={() => loadSwarms(pagination.page)} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search swarms by name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Search
              </Button>
            </div>
            <Select value={statusFilter || 'all'} onValueChange={(v) => handleStatusChange(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading && swarms.length === 0 ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : swarms.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No swarms found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Swarm</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {swarms.map((swarm, index) => (
                    <motion.tr
                      key={swarm.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Hexagon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{swarm.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                              {swarm.task || 'No task defined'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{swarm.owner_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{swarm.owner_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(swarm.status)}
                      </TableCell>
                      <TableCell>
                        {getVisibilityBadge(swarm.visibility)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Bot className="h-4 w-4" />
                            {swarm.agent_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {swarm.message_count}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(swarm.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/swarms/${swarm.id}`} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Swarm
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(swarm)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(swarm)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openTransferDialog(swarm)}>
                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                              Transfer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(swarm)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Swarm</DialogTitle>
            <DialogDescription>Modify swarm settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Task</Label>
              <Textarea
                value={editForm.task}
                onChange={(e) => setEditForm({ ...editForm, task: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={editForm.visibility} onValueChange={(v) => setEditForm({ ...editForm, visibility: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSwarm} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Swarm</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingSwarm?.name}&quot;? This will also delete all messages and context blocks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSwarm} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Swarm</DialogTitle>
            <DialogDescription>
              Transfer &quot;{transferringSwarm?.name}&quot; to another user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Owner</Label>
            {loadingUsers ? (
              <Skeleton className="h-10 w-full mt-2" />
            ) : (
              <Select value={transferUserId} onValueChange={setTransferUserId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={saving || !transferUserId}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
