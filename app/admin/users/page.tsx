'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  MoreHorizontal,
  User,
  Shield,
  Ban,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  UserCog,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminUsers, type AdminUser, type UserListFilters } from '@/hooks/use-admin-users'
import { useToast } from '@/hooks/use-toast'
import { UserDetailsDialog } from '@/components/admin/user-details-dialog'
import { EditUserDialog } from '@/components/admin/edit-user-dialog'
import { SuspendUserDialog } from '@/components/admin/suspend-user-dialog'
import { DeleteUserDialog } from '@/components/admin/delete-user-dialog'
import { formatDistanceToNow } from 'date-fns'

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 px-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-40 h-4" />
          <Skeleton className="w-48 h-4" />
          <Skeleton className="w-20 h-6 rounded-full" />
          <Skeleton className="w-16 h-6 rounded-full" />
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-8 h-8" />
        </div>
      ))}
    </div>
  )
}

export default function AdminUsersPage() {
  const { users, pagination, loading, error, fetchUsers, getImpersonationLink } = useAdminUsers()
  const { toast } = useToast()

  const [filters, setFilters] = useState<UserListFilters>({
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const loadUsers = useCallback(async (page: number = 1, newFilters?: UserListFilters) => {
    try {
      await fetchUsers(page, newFilters || filters)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users',
      })
    }
  }, [fetchUsers, filters, toast])

  useEffect(() => {
    loadUsers(1)
  }, [])

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchInput }
    setFilters(newFilters)
    loadUsers(1, newFilters)
  }

  const handleFilterChange = (key: keyof UserListFilters, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value === 'all' ? undefined : value }
    setFilters(newFilters)
    loadUsers(1, newFilters)
  }

  const handlePageChange = (page: number) => {
    loadUsers(page)
  }

  const handleImpersonate = async (user: AdminUser) => {
    try {
      const link = await getImpersonationLink(user.id)
      window.open(link, '_blank')
      toast({
        title: 'Impersonation link generated',
        description: `Opening session as ${user.full_name || user.email}`,
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to generate impersonation link',
      })
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge className="bg-amber-500/20 text-amber-600 hover:bg-amber-500/30">Enterprise</Badge>
      case 'pro':
        return <Badge className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30">Pro</Badge>
      default:
        return <Badge variant="secondary">Free</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge className="bg-red-500/20 text-red-600 hover:bg-red-500/30">Admin</Badge>
    }
    return null
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            {pagination.total} total users
          </p>
        </div>
        <Button onClick={() => loadUsers(pagination.page)} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
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

            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.plan || 'all'}
                onValueChange={(value) => handleFilterChange('plan', value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.role || 'all'}
                onValueChange={(value) => handleFilterChange('role', value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.suspended === undefined ? 'all' : filters.suspended.toString()}
                onValueChange={(value) =>
                  handleFilterChange('suspended', value === 'all' ? undefined : value === 'true')
                }
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="false">Active</SelectItem>
                  <SelectItem value="true">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy || 'created_at'}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Join Date</SelectItem>
                  <SelectItem value="updated_at">Last Updated</SelectItem>
                  <SelectItem value="full_name">Name</SelectItem>
                  <SelectItem value="plan">Plan</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading && users.length === 0 ? (
            <TableSkeleton />
          ) : error ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>{error}</p>
              <Button onClick={() => loadUsers(1)} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {user.full_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name || 'Unnamed'}</p>
                            {user.totp_enabled && (
                              <span className="text-xs text-emerald-600">2FA enabled</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || '-'}
                      </TableCell>
                      <TableCell>{getPlanBadge(user.plan)}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.suspended ? (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="h-3 w-3" />
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-600/30">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-muted-foreground">{user.agent_count} agents</span>
                          <span className="mx-1 text-muted-foreground/50">|</span>
                          <span className="text-muted-foreground">{user.swarm_count} swarms</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setDetailsOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setEditOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.role !== 'admin' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setSuspendOpen(true)
                                  }}
                                >
                                  {user.suspended ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Unsuspend Account
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Suspend Account
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleImpersonate(user)}>
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Impersonate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setDeleteOpen(true)
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </>
                            )}
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
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let page: number
                if (pagination.totalPages <= 5) {
                  page = i + 1
                } else if (pagination.page <= 3) {
                  page = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  page = pagination.totalPages - 4 + i
                } else {
                  page = pagination.page - 2 + i
                }

                return (
                  <Button
                    key={page}
                    variant={page === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    disabled={loading}
                    className="w-8"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
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

      <UserDetailsDialog
        user={selectedUser}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <EditUserDialog
        user={selectedUser}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => loadUsers(pagination.page)}
      />

      <SuspendUserDialog
        user={selectedUser}
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        onSuccess={() => loadUsers(pagination.page)}
      />

      <DeleteUserDialog
        user={selectedUser}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => loadUsers(pagination.page)}
      />
    </div>
  )
}
