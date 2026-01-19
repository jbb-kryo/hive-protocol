'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const plans = [
  {
    name: 'Basic',
    price: '$0',
    description: 'For personal projects and exploration',
    features: [
      '3 agents',
      '2 active swarms',
      '1,000 messages/month',
      'Community support',
      'Basic integrations',
    ],
    cta: 'Get Started',
    href: '/onboarding',
    planId: null,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For professionals and small teams',
    features: [
      '10 agents',
      '10 active swarms',
      '50,000 messages/month',
      'Workflows',
      'Marketplace',
      'Priority support',
      'All integrations',
      'Custom tools',
      'API access',
    ],
    cta: 'Get Started',
    href: '/signup?plan=pro',
    popular: true,
    planId: 'pro' as const,
  },
  {
    name: 'Unlimited',
    price: '$99',
    period: '/month',
    description: 'For power users and growing teams',
    features: [
      'Unlimited agents',
      'Unlimited swarms',
      'Unlimited messages',
      'Workflows',
      'Teams',
      'Marketplace',
      'Priority support',
      'All integrations',
      'Custom tools',
      'API access',
      'Advanced analytics',
    ],
    cta: 'Get Started',
    href: '/signup?plan=unlimited',
    planId: 'unlimited' as const,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For organizations at scale',
    features: [
      'Everything in Unlimited',
      'Dedicated support',
      'Custom integrations',
      'SSO & SAML',
      'SLA guarantee',
      'On-premise option',
      'Custom contracts',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    planId: null,
  },
]

export function PricingSection() {
  const { toast } = useToast()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleUpgrade = async (planId: 'pro' | 'unlimited' | 'enterprise') => {
    setLoadingPlan(planId)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = `/signup?plan=${planId}`
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-checkout',
          plan: planId,
          returnUrl: window.location.origin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
      setLoadingPlan(null)
    }
  }

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with Basic access, scale as you grow. No hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={`h-full flex flex-col ${
                  plan.popular ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                <CardHeader>
                  {plan.popular && (
                    <Badge className="w-fit mb-2">Most Popular</Badge>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {plan.planId ? (
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(plan.planId!)}
                      disabled={loadingPlan !== null}
                    >
                      {loadingPlan === plan.planId ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
