'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  CreditCard,
  Check,
  AlertCircle,
  ExternalLink,
  Download,
  Loader2,
  Clock,
  Zap,
  Shield,
  Crown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useBilling } from '@/hooks/use-billing'
import { useToast } from '@/hooks/use-toast'
import { useStore } from '@/store'

const PLAN_FEATURES: Record<string, {
  name: string
  price: string
  period?: string
  features: string[]
  icon: typeof Zap
}> = {
  free: {
    name: 'Basic',
    price: '$0',
    features: ['3 agents', '2 active swarms', '1,000 messages/month', 'Community support', 'Basic integrations'],
    icon: Zap,
  },
  pro: {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: ['10 agents', '10 active swarms', '50,000 messages/month', 'Workflows', 'Marketplace', 'Priority support', 'All integrations', 'Custom tools', 'API access'],
    icon: Shield,
  },
  unlimited: {
    name: 'Unlimited',
    price: '$99',
    period: '/month',
    features: ['Unlimited agents', 'Unlimited swarms', 'Unlimited messages', 'Workflows', 'Teams', 'Marketplace', 'Priority support', 'All integrations', 'Custom tools', 'API access', 'Advanced analytics'],
    icon: Shield,
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    features: ['Everything in Unlimited', 'Dedicated support', 'Custom integrations', 'SSO & SAML', 'SLA guarantee', 'On-premise option'],
    icon: Crown,
  },
}

export function BillingTab() {
  const { isDemo } = useStore()
  const { toast } = useToast()
  const {
    subscription,
    billingHistory,
    plan,
    isActive,
    isTrialing,
    isCanceling,
    loading,
    createCheckout,
    openPortal,
    cancelSubscription,
    resumeSubscription,
    refresh,
  } = useBilling()

  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [managingPortal, setManagingPortal] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const currentPlan = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.free
  const PlanIcon = currentPlan.icon

  const handleUpgrade = async (targetPlan: 'pro' | 'unlimited' | 'enterprise') => {
    if (isDemo) {
      toast({
        title: 'Demo Mode',
        description: 'Billing is not available in demo mode.',
        variant: 'destructive',
      })
      return
    }

    setUpgrading(targetPlan)
    const result = await createCheckout(targetPlan)
    setUpgrading(null)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.url) {
      window.location.href = result.url
    }
  }

  const handleManageBilling = async () => {
    if (isDemo) {
      toast({
        title: 'Demo Mode',
        description: 'Billing is not available in demo mode.',
        variant: 'destructive',
      })
      return
    }

    setManagingPortal(true)
    const result = await openPortal()
    setManagingPortal(false)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.url) {
      window.location.href = result.url
    }
  }

  const handleCancel = async () => {
    setCanceling(true)
    const result = await cancelSubscription()
    setCanceling(false)
    setShowCancelDialog(false)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Subscription Canceled',
        description: 'Your subscription will end at the current billing period.',
      })
    }
  }

  const handleResume = async () => {
    setResuming(true)
    const result = await resumeSubscription()
    setResuming(false)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Subscription Resumed',
        description: 'Your subscription has been resumed.',
      })
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (timestamp: number | string | null) => {
    if (!timestamp) return 'N/A'
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp)
    return format(date, 'MMM d, yyyy')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <PlanIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
                    {isTrialing && (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Trial
                      </Badge>
                    )}
                    {isCanceling && (
                      <Badge variant="destructive">Canceling</Badge>
                    )}
                    {isActive && !isTrialing && !isCanceling && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentPlan.price}
                    {currentPlan.period && <span>{currentPlan.period}</span>}
                  </p>
                </div>
              </div>
              {plan === 'free' ? (
                <LoadingButton
                  onClick={() => handleUpgrade('pro')}
                  loading={upgrading === 'pro'}
                  disabled={!!upgrading}
                >
                  Upgrade to Pro
                </LoadingButton>
              ) : (
                <LoadingButton
                  variant="outline"
                  onClick={handleManageBilling}
                  loading={managingPortal}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Billing
                </LoadingButton>
              )}
            </div>

            {subscription && (
              <div className="mt-4 pt-4 border-t border-primary/20 text-sm text-muted-foreground">
                {isTrialing && subscription.trial_ends_at && (
                  <p>Trial ends: {formatDate(subscription.trial_ends_at)}</p>
                )}
                {!isTrialing && subscription.current_period_end && (
                  <p>
                    {isCanceling ? 'Access until' : 'Next billing date'}:{' '}
                    {formatDate(subscription.current_period_end)}
                  </p>
                )}
              </div>
            )}

            <ul className="mt-4 grid grid-cols-2 gap-2">
              {currentPlan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {isCanceling && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Your subscription is set to cancel at the end of the billing period.</span>
                <LoadingButton
                  variant="outline"
                  size="sm"
                  onClick={handleResume}
                  loading={resuming}
                >
                  Resume Subscription
                </LoadingButton>
              </AlertDescription>
            </Alert>
          )}

          {plan === 'free' && (
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-primary">
                <CardHeader className="pb-2">
                  <Badge className="w-fit">Recommended</Badge>
                  <CardTitle className="text-lg">Pro Plan</CardTitle>
                  <p className="text-2xl font-bold">
                    $29<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Perfect for professionals and small teams</p>
                  <LoadingButton
                    className="w-full"
                    onClick={() => handleUpgrade('pro')}
                    loading={upgrading === 'pro'}
                    disabled={!!upgrading}
                  >
                    Get Started
                  </LoadingButton>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Unlimited Plan</CardTitle>
                  <p className="text-2xl font-bold">
                    $99<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">For power users and growing teams</p>
                  <LoadingButton
                    className="w-full"
                    onClick={() => handleUpgrade('unlimited')}
                    loading={upgrading === 'unlimited'}
                    disabled={!!upgrading}
                  >
                    Get Started
                  </LoadingButton>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Enterprise</CardTitle>
                  <p className="text-2xl font-bold">Custom</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">For large teams and organizations</p>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/contact">Contact Sales</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {subscription && subscription.payment_method_last4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-muted">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium capitalize">
                    {subscription.payment_method_brand || 'Card'} ending in {subscription.payment_method_last4}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleManageBilling}>
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No billing history yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{formatCurrency(item.amount, item.currency)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'paid'
                            ? 'default'
                            : item.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.invoice_pdf && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={item.invoice_pdf} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isActive && plan !== 'free' && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Cancel Subscription</CardTitle>
            <CardDescription>
              Cancel your subscription. You'll retain access until the end of your billing period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={isCanceling}
            >
              Cancel Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to Pro features
              at the end of your current billing period on{' '}
              {subscription?.current_period_end
                ? formatDate(subscription.current_period_end)
                : 'the end of this period'}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={canceling}
            >
              {canceling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
