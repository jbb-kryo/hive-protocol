'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Bot,
  Hexagon,
  Activity,
  Clock,
  Ban,
  CheckCircle,
  Loader2,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { CURRENT_TOS_VERSION, CURRENT_PRIVACY_VERSION } from '@/lib/auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminUsers, type AdminUser, type UserDetails } from '@/hooks/use-admin-users'

interface UserDetailsDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  const { getUserDetails } = useAdminUsers()
  const [details, setDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && user) {
      setLoading(true)
      getUserDetails(user.id)
        .then(setDetails)
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setDetails(null)
    }
  }, [open, user, getUserDetails])

  if (!user) return null

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge className="bg-amber-500/20 text-amber-600">Enterprise</Badge>
      case 'pro':
        return <Badge className="bg-blue-500/20 text-blue-600">Pro</Badge>
      default:
        return <Badge variant="secondary">Free</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-4 pb-4 border-b">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {user.full_name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{user.full_name || 'Unnamed'}</h3>
              {user.role === 'admin' && (
                <Badge className="bg-red-500/20 text-red-600">Admin</Badge>
              )}
              {user.suspended && (
                <Badge variant="destructive">Suspended</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{user.email || 'No email'}</p>
            <div className="flex items-center gap-4 mt-2">
              {getPlanBadge(user.plan)}
              {user.totp_enabled && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-600/30">
                  2FA Enabled
                </Badge>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : details ? (
          <Tabs defaultValue="overview" className="flex-1 min-h-0">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="agents">Agents ({details.agents.length})</TabsTrigger>
              <TabsTrigger value="swarms">Swarms ({details.swarms.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="overview" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Joined</span>
                    </div>
                    <p className="font-medium">
                      {format(new Date(details.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(details.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Last Sign In</span>
                    </div>
                    <p className="font-medium">
                      {details.last_sign_in_at
                        ? format(new Date(details.last_sign_in_at), 'MMM d, yyyy')
                        : 'Never'}
                    </p>
                    {details.last_sign_in_at && (
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(details.last_sign_in_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">Email Status</span>
                    </div>
                    {details.email_confirmed_at ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Unverified</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Onboarding</span>
                    </div>
                    {details.onboarding_complete ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Incomplete</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">Terms Acceptance</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Terms of Service</span>
                      {details.tos_accepted_at ? (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {details.tos_version === CURRENT_TOS_VERSION ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              details.tos_version === CURRENT_TOS_VERSION ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              v{details.tos_version}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(details.tos_accepted_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Not Accepted</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Privacy Policy</span>
                      {details.privacy_accepted_at ? (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {details.privacy_version === CURRENT_PRIVACY_VERSION ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              details.privacy_version === CURRENT_PRIVACY_VERSION ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              v{details.privacy_version}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(details.privacy_accepted_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Not Accepted</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {details.suspended && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <Ban className="h-4 w-4" />
                      <span className="font-medium">Account Suspended</span>
                    </div>
                    {details.suspended_at && (
                      <p className="text-sm text-muted-foreground">
                        Suspended {formatDistanceToNow(new Date(details.suspended_at), { addSuffix: true })}
                      </p>
                    )}
                    {details.suspended_reason && (
                      <p className="text-sm mt-2">Reason: {details.suspended_reason}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <span className="font-medium">Agents</span>
                    </div>
                    <p className="text-2xl font-bold">{details.agents.length}</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Hexagon className="h-5 w-5 text-primary" />
                      <span className="font-medium">Swarms</span>
                    </div>
                    <p className="text-2xl font-bold">{details.swarms.length}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="agents" className="mt-0">
                {details.agents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No agents created
                  </div>
                ) : (
                  <div className="space-y-2">
                    {details.agents.map((agent) => (
                      <div key={agent.id} className="p-3 rounded-lg border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {agent.framework} {agent.model && `- ${agent.model}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="swarms" className="mt-0">
                {details.swarms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No swarms created
                  </div>
                ) : (
                  <div className="space-y-2">
                    {details.swarms.map((swarm) => (
                      <div key={swarm.id} className="p-3 rounded-lg border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Hexagon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{swarm.name}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {swarm.status}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(swarm.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                {details.recent_activity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity
                  </div>
                ) : (
                  <div className="space-y-2">
                    {details.recent_activity.map((activity) => (
                      <div key={activity.id} className="p-3 rounded-lg border flex items-center justify-between">
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.activity_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
