'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganizationUsage } from '@/hooks/use-organizations';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check, CreditCard, TrendingUp, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const ALLOWED_PLANS = ['unlimited', 'enterprise'];

interface Organization {
  id: string;
  name: string;
  plan: string;
  max_members: number;
  max_agents: number;
  max_swarms: number;
}

const PLANS = [
  {
    name: 'Basic',
    price: 0,
    features: ['5 team members', '10 agents', '5 swarms', 'Community support'],
  },
  {
    name: 'Pro',
    price: 29,
    features: ['25 team members', '50 agents', '25 swarms', 'Priority support', 'Advanced analytics'],
  },
  {
    name: 'Unlimited',
    price: 99,
    features: ['Unlimited members', 'Unlimited agents', 'Unlimited swarms', 'Priority support', 'Advanced analytics'],
  },
  {
    name: 'Enterprise',
    price: null,
    priceDisplay: 'Contact Sales',
    features: ['Everything in Unlimited', 'Dedicated support', 'Custom integrations', 'SSO & SAML', 'SLA guarantee'],
  },
];

export default function TeamBillingPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;
  const { user, isDemo } = useStore();

  const userPlan = user?.plan || 'free';
  const hasAccess = isDemo || ALLOWED_PLANS.includes(userPlan);

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const { usage } = useOrganizationUsage(organizationId);

  useEffect(() => {
    const fetchOrganization = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        if (error || !data) {
          toast.error('Organization not found');
          router.push('/teams');
          return;
        }

        setOrganization(data);
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
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
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/teams">
                Back to Teams
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/teams')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teams
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{organization.name} Billing</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage subscription and view usage
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge className="mb-2">{organization.plan}</Badge>
                  <div className="text-3xl font-bold">
                    {(() => {
                      const currentPlan = PLANS.find((p) => p.name.toLowerCase() === organization.plan);
                      if (currentPlan?.priceDisplay) {
                        return currentPlan.priceDisplay;
                      }
                      return (
                        <>
                          ${currentPlan?.price || 0}
                          <span className="text-lg font-normal text-slate-600 dark:text-slate-400">/month</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <Button className="w-full gap-2">
                  <CreditCard className="h-4 w-4" />
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agents Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{usage?.agents_count || 0} of {organization.max_agents}</span>
                    <span>{Math.round((usage?.agents_count || 0) / organization.max_agents * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${Math.min((usage?.agents_count || 0) / organization.max_agents * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Swarms Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{usage?.swarms_count || 0} of {organization.max_swarms}</span>
                    <span>{Math.round((usage?.swarms_count || 0) / organization.max_swarms * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${Math.min((usage?.swarms_count || 0) / organization.max_swarms * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {PLANS.map((plan) => (
                <Card
                  key={plan.name}
                  className={plan.name.toLowerCase() === organization.plan ? 'ring-2 ring-blue-500' : ''}
                >
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {plan.priceDisplay ? (
                        plan.priceDisplay
                      ) : (
                        <>
                          ${plan.price}
                          <span className="text-lg font-normal text-slate-600 dark:text-slate-400">/month</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.name.toLowerCase() === organization.plan ? 'outline' : 'default'}
                      className="w-full"
                      disabled={plan.name.toLowerCase() === organization.plan}
                      onClick={() => {
                        if (plan.name === 'Enterprise') {
                          router.push('/contact');
                        }
                      }}
                    >
                      {plan.name.toLowerCase() === organization.plan
                        ? 'Current Plan'
                        : plan.name === 'Enterprise'
                        ? 'Contact Sales'
                        : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
