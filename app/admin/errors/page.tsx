'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, Filter, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTransition } from '@/components/ui/page-transition'
import { SkeletonTable } from '@/components/ui/skeleton-card'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface ErrorLog {
  id: string
  user_id: string
  error_message: string
  error_stack: string
  error_name: string
  url: string
  user_agent: string
  context: Record<string, any>
  created_at: string
  resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  notes: string | null
}

export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)

  useEffect(() => {
    fetchErrors()
  }, [filter])

  const fetchErrors = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter === 'unresolved') {
        query = query.eq('resolved', false)
      } else if (filter === 'resolved') {
        query = query.eq('resolved', true)
      }

      const { data, error } = await query

      if (error) throw error
      setErrors(data || [])
    } catch (err) {
      console.error('Error fetching error logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsResolved = async (errorId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          notes,
        })
        .eq('id', errorId)

      if (error) throw error

      await fetchErrors()
      setSelectedError(null)
    } catch (err) {
      console.error('Error marking as resolved:', err)
    }
  }

  const filteredErrors = errors.filter(error =>
    error.error_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    error.error_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    error.url?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const errorsByType = filteredErrors.reduce((acc, error) => {
    acc[error.error_name] = (acc[error.error_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topErrors = Object.entries(errorsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <PageTransition>
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Error Logs</h1>
          <p className="text-muted-foreground">Monitor and resolve application errors</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unresolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {errors.filter(e => !e.resolved).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {errors.filter(e => e.resolved).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search errors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchErrors}>
                    <Filter className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <SkeletonTable rows={5} columns={3} />
                ) : filteredErrors.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No errors found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2 pr-4">
                      {filteredErrors.map((error) => (
                        <div
                          key={error.id}
                          onClick={() => setSelectedError(error)}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedError?.id === error.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={error.resolved ? 'secondary' : 'destructive'}>
                                  {error.error_name}
                                </Badge>
                                {error.resolved && <CheckCircle className="w-4 h-4 text-green-500" />}
                              </div>
                              <p className="text-sm font-medium truncate mb-1">
                                {error.error_message}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
                                </span>
                                {error.url && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-xs">{error.url}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Top Error Types</CardTitle>
              </CardHeader>
              <CardContent>
                {topErrors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No error data available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topErrors.map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{type}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedError && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Error Details</CardTitle>
                  <CardDescription>
                    {formatDistanceToNow(new Date(selectedError.created_at), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Error Message</p>
                    <p className="text-sm text-muted-foreground">{selectedError.error_message}</p>
                  </div>

                  {selectedError.url && (
                    <div>
                      <p className="text-sm font-medium mb-1">URL</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {selectedError.url}
                      </p>
                    </div>
                  )}

                  {selectedError.error_stack && (
                    <div>
                      <p className="text-sm font-medium mb-1">Stack Trace</p>
                      <ScrollArea className="h-32">
                        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                          {selectedError.error_stack}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}

                  {!selectedError.resolved && (
                    <Button
                      onClick={() => markAsResolved(selectedError.id)}
                      className="w-full"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
