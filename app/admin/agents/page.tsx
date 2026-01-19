'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Bot,
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
  Sparkles,
  Plus,
  Filter,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdminAI, type AdminAgent, type Pagination } from '@/hooks/use-admin-ai'
import { useAdminUsers } from '@/hooks/use-admin-users'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

const FRAMEWORKS = ['langchain', 'autogen', 'crewai', 'custom']

export default function AdminAgentsPage() {
  const router = useRouter()
  const {
    listAllAgents,
    updateAgent,
    deleteAgent,
    duplicateAgent,
    transferAgent,
  } = useAdminAI()
  const { fetchUsers } = useAdminUsers()
  const { toast } = useToast()

  const [agents, setAgents] = useState<AdminAgent[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AdminAgent | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    framework: 'custom',
    model: '',
    system_prompt: '',
  })

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingAgent, setDeletingAgent] = useState<AdminAgent | null>(null)

  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferringAgent, setTransferringAgent] = useState<AdminAgent | null>(null)
  const [transferUserId, setTransferUserId] = useState('')
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [saving, setSaving] = useState(false)

  const loadAgents = useCallback(async (page: number = 1, searchTerm?: string) => {
    try {
      setLoading(true)
      const data = await listAllAgents({
        page,
        limit: 20,
        search: searchTerm || search,
      })
      setAgents(data.agents)
      setPagination(data.pagination)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load agents',
      })
    } finally {
      setLoading(false)
    }
  }, [listAllAgents, search, toast])

  useEffect(() => {
    loadAgents(1)
  }, [])

  const handleSearch = () => {
    setSearch(searchInput)
    loadAgents(1, searchInput)
  }

  const handlePageChange = (page: number) => {
    loadAgents(page)
  }

  const openEditDialog = (agent: AdminAgent) => {
    setEditingAgent(agent)
    setEditForm({
      name: agent.name,
      role: agent.role || '',
      framework: agent.framework,
      model: agent.model || '',
      system_prompt: agent.system_prompt || '',
    })
    setEditDialogOpen(true)
  }

  const handleSaveAgent = async () => {
    if (!editingAgent) return
    try {
      setSaving(true)
      await updateAgent(editingAgent.id, editForm)
      toast({ title: 'Agent updated' })
      setEditDialogOpen(false)
      loadAgents(pagination.page)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update agent',
      })
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (agent: AdminAgent) => {
    setDeletingAgent(agent)
    setDeleteDialogOpen(true)
  }

  const handleDeleteAgent = async () => {
    if (!deletingAgent) return
    try {
      setSaving(true)
      await deleteAgent(deletingAgent.id)
      toast({ title: 'Agent deleted' })
      setDeleteDialogOpen(false)
      loadAgents(pagination.page)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete agent',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async (agent: AdminAgent) => {
    try {
      await duplicateAgent(agent.id)
      toast({ title: 'Agent duplicated' })
      loadAgents(pagination.page)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to duplicate agent',
      })
    }
  }

  const openTransferDialog = async (agent: AdminAgent) => {
    setTransferringAgent(agent)
    setTransferUserId('')
    setTransferDialogOpen(true)

    try {
      setLoadingUsers(true)
      const data = await fetchUsers(1, { limit: 100 } as any)
      setUsers(data.users.filter((u: any) => u.id !== agent.user_id))
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
    if (!transferringAgent || !transferUserId) return
    try {
      setSaving(true)
      await transferAgent(transferringAgent.id, transferUserId)
      toast({ title: 'Agent transferred' })
      setTransferDialogOpen(false)
      loadAgents(pagination.page)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to transfer agent',
      })
    } finally {
      setSaving(false)
    }
  }

  const getFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'langchain': return 'bg-emerald-500/20 text-emerald-600'
      case 'autogen': return 'bg-blue-500/20 text-blue-600'
      case 'crewai': return 'bg-orange-500/20 text-orange-600'
      default: return 'bg-gray-500/20 text-gray-600'
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary" />
            Agent Management
          </h1>
          <p className="text-muted-foreground">
            {pagination.total} agents across all users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/admin/templates')} variant="outline" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Manage Templates
          </Button>
          <Button onClick={() => loadAgents(pagination.page)} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents by name..."
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading && agents.length === 0 ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No agents found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Framework</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent, index) => (
                    <motion.tr
                      key={agent.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-sm text-muted-foreground">{agent.role || 'No role'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{agent.owner_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{agent.owner_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getFrameworkColor(agent.framework)}>
                          {agent.framework}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {agent.model || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(agent)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(agent)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openTransferDialog(agent)}>
                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                              Transfer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(agent)}
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
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>Modify agent settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Framework</Label>
                <Select value={editForm.framework} onValueChange={(v) => setEditForm({ ...editForm, framework: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea
                value={editForm.system_prompt}
                onChange={(e) => setEditForm({ ...editForm, system_prompt: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAgent} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingAgent?.name}&quot;? This will also remove the agent from any swarms.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAgent} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Agent</DialogTitle>
            <DialogDescription>
              Transfer &quot;{transferringAgent?.name}&quot; to another user. The agent will be removed from its current swarms.
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
