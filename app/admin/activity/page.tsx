'use client'

import { useEffect, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import {
  History,
  RefreshCw,
  Filter,
  User,
  Calendar,
  Globe,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAdminAuditLog,
  AuditLogEntry,
  AuditLogFilters,
  getActionLabel,
  getActionColor,
} from '@/hooks/use-admin-audit-log'

function AuditLogSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  )
}

export default function AdminActivityPage() {
  const {
    entries,
    pagination,
    loading,
    error,
    fetchAuditLog,
    getUniqueActions,
    getUniqueAdmins,
  } = useAdminAuditLog()

  const [filters, setFilters] = useState<AuditLogFilters>({})
  const [availableActions, setAvailableActions] = useState<string[]>([])
  const [availableAdmins, setAvailableAdmins] = useState<Array<{ id: string; name: string }>>([])
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)

  useEffect(() => {
    fetchAuditLog(1, filters)
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async () => {
    const [actions, admins] = await Promise.all([
      getUniqueActions(),
      getUniqueAdmins(),
    ])
    setAvailableActions(actions)
    setAvailableAdmins(admins)
  }

  const handleFilterChange = (key: keyof AuditLogFilters, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    fetchAuditLog(1, newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    fetchAuditLog(1, {})
  }

  const handlePageChange = (newPage: number) => {
    fetchAuditLog(newPage, filters)
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined)

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Admin Activity Log
          </h1>
          <p className="text-muted-foreground">
            Track all administrative actions and changes
          </p>
        </div>
        <Button onClick={() => fetchAuditLog(pagination.page, filters)} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select
              value={filters.action || 'all'}
              onValueChange={(v) => handleFilterChange('action', v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {availableActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {getActionLabel(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.target_type || 'all'}
              onValueChange={(v) => handleFilterChange('target_type', v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="swarm">Swarm</SelectItem>
                <SelectItem value="config">Config</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.admin_user_id || 'all'}
              onValueChange={(v) => handleFilterChange('admin_user_id', v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Admins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {availableAdmins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
              className="w-[160px]"
            />

            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
              className="w-[160px]"
            />

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity History</CardTitle>
            <span className="text-sm text-muted-foreground">
              {pagination.total} total entries
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading && entries.length === 0 ? (
            <AuditLogSkeleton />
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground">
                Admin actions will appear here once they occur.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.admin_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {entry.admin_profile?.full_name?.[0]?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {entry.admin_profile?.full_name || 'Unknown Admin'}
                      </span>
                      <Badge className={`text-xs ${getActionColor(entry.action)}`}>
                        {getActionLabel(entry.action)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.target_type && (
                        <span className="capitalize">{entry.target_type}</span>
                      )}
                      {entry.target_id && (
                        <span className="ml-1 font-mono text-xs">
                          ({entry.target_id.slice(0, 8)}...)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm text-muted-foreground shrink-0">
                    <div>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</div>
                    {entry.ip_address && (
                      <div className="text-xs flex items-center justify-end gap-1 mt-1">
                        <Globe className="h-3 w-3" />
                        {entry.ip_address}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              Full details of this admin action
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedEntry.admin_profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedEntry.admin_profile?.full_name?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {selectedEntry.admin_profile?.full_name || 'Unknown Admin'}
                  </div>
                  <Badge className={`text-xs ${getActionColor(selectedEntry.action)}`}>
                    {getActionLabel(selectedEntry.action)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Timestamp
                  </div>
                  <div>{format(new Date(selectedEntry.created_at), 'PPpp')}</div>
                </div>

                {selectedEntry.target_type && (
                  <div>
                    <div className="text-muted-foreground mb-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Target
                    </div>
                    <div className="capitalize">{selectedEntry.target_type}</div>
                  </div>
                )}

                {selectedEntry.ip_address && (
                  <div>
                    <div className="text-muted-foreground mb-1 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      IP Address
                    </div>
                    <div className="font-mono text-xs">{selectedEntry.ip_address}</div>
                  </div>
                )}

                {selectedEntry.target_id && (
                  <div>
                    <div className="text-muted-foreground mb-1">Target ID</div>
                    <div className="font-mono text-xs break-all">{selectedEntry.target_id}</div>
                  </div>
                )}
              </div>

              {selectedEntry.user_agent && (
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1 text-sm">
                    <Monitor className="h-3 w-3" />
                    User Agent
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono break-all">
                    {selectedEntry.user_agent}
                  </div>
                </div>
              )}

              {Object.keys(selectedEntry.details || {}).length > 0 && (
                <div>
                  <div className="text-muted-foreground mb-1 text-sm">Details</div>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                    {JSON.stringify(selectedEntry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
