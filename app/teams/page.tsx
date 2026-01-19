'use client'

import { useRouter } from 'next/navigation'
import { useOrganizations } from '@/hooks/use-organizations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { DemoBanner } from '@/components/dashboard/demo-banner'
import { useStore } from '@/store'
import {
  Building2,
  Plus,
  Users,
  Settings,
  CreditCard,
  ArrowRight,
  Loader2,
  Lock,
  Shield,
  Share2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const ALLOWED_PLANS = ['unlimited', 'enterprise']

export default function TeamsPage() {
  const router = useRouter()
  const { isDemo, user } = useStore()
  const { organizations, currentOrganization, loading, switchOrganization } = useOrganizations()

  const userPlan = user?.plan || 'free'
  const hasAccess = isDemo || ALLOWED_PLANS.includes(userPlan)

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Upgrade to Access Teams</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Teams collaboration is available on Unlimited and Enterprise plans.
            Create organizations, invite team members, and manage shared resources together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/settings?tab=billing">
                Manage Subscription
              </Link>
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Invite unlimited team members and assign roles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Shared Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share agents, swarms, and tools across your team
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fine-grained permissions and role management
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {isDemo && <DemoBanner />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Teams</h1>
            <p className="text-muted-foreground">
              Manage your organizations and collaborate with your team
            </p>
          </div>
          <Button
            onClick={() => router.push('/teams/create')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Team
          </Button>
        </div>

        {organizations.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Teams Yet"
            description="Create your first team to start collaborating with others. Teams allow you to share agents, swarms, and manage billing together."
            action={{
              label: 'Create Your First Team',
              onClick: () => router.push('/teams/create'),
            }}
            variant="card"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org, index) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    currentOrganization?.id === org.id
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                  onClick={() => switchOrganization(org)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{org.name}</CardTitle>
                          <CardDescription>@{org.slug}</CardDescription>
                        </div>
                      </div>
                      {currentOrganization?.id === org.id && (
                        <Badge>Active</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {org.plan}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {org.description || 'No description'}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{org.max_members}</div>
                        <div className="text-xs text-muted-foreground">
                          Max Members
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{org.max_agents}</div>
                        <div className="text-xs text-muted-foreground">
                          Max Agents
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/teams/${org.id}/settings`}
                        className="flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Settings className="h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                      <Link
                        href={`/teams/${org.id}/members`}
                        className="flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Users className="h-4 w-4" />
                          Members
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {currentOrganization && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href={`/teams/${currentOrganization.id}/members`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Manage Members</h3>
                    <p className="text-sm text-muted-foreground">
                      Invite team members and manage permissions
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/teams/${currentOrganization.id}/billing`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Team Billing</h3>
                    <p className="text-sm text-muted-foreground">
                      View usage and manage subscription
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/teams/${currentOrganization.id}/settings`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-amber-500/10 rounded-lg">
                        <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Team Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure team preferences and limits
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
