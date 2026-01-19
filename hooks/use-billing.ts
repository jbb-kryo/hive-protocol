'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'

interface Subscription {
  customer_id: string
  subscription_id: string | null
  price_id: string | null
  status: string
  current_period_start: number | null
  current_period_end: number | null
  cancel_at_period_end: boolean
  payment_method_brand: string | null
  payment_method_last4: string | null
  trial_ends_at: number | null
  plan_name: string
}

interface BillingHistoryItem {
  id: string
  stripe_invoice_id: string
  amount: number
  currency: string
  status: string
  description: string
  invoice_pdf: string | null
  hosted_invoice_url: string | null
  period_start: string | null
  period_end: string | null
  created_at: string
}

interface UseBillingReturn {
  subscription: Subscription | null
  billingHistory: BillingHistoryItem[]
  plan: string
  isActive: boolean
  isTrialing: boolean
  isCanceling: boolean
  loading: boolean
  error: string | null
  createCheckout: (plan: 'pro' | 'unlimited' | 'enterprise') => Promise<{ url?: string; error?: string }>
  openPortal: () => Promise<{ url?: string; error?: string }>
  cancelSubscription: () => Promise<{ success?: boolean; error?: string }>
  resumeSubscription: () => Promise<{ success?: boolean; error?: string }>
  refresh: () => Promise<void>
}

export function useBilling(): UseBillingReturn {
  const { isDemo } = useStore()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const plan = subscription?.plan_name || 'free'
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const isTrialing = subscription?.status === 'trialing'
  const isCanceling = subscription?.cancel_at_period_end === true

  const fetchBillingData = useCallback(async () => {
    if (isDemo) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      }

      const [subResponse, historyResponse] = await Promise.all([
        fetch(`${baseUrl}/functions/v1/stripe-checkout`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'get-subscription' }),
        }),
        fetch(`${baseUrl}/functions/v1/stripe-checkout`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'get-billing-history' }),
        }),
      ])

      if (subResponse.ok) {
        const subData = await subResponse.json()
        setSubscription(subData.subscription)
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setBillingHistory(historyData.history || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => {
    fetchBillingData()
  }, [fetchBillingData])

  const createCheckout = async (planType: 'pro' | 'unlimited' | 'enterprise') => {
    if (isDemo) {
      return { error: 'Billing is not available in demo mode' }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-checkout',
          plan: planType,
          returnUrl: window.location.origin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to create checkout session' }
      }

      return { url: data.url }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to create checkout' }
    }
  }

  const openPortal = async () => {
    if (isDemo) {
      return { error: 'Billing is not available in demo mode' }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-portal',
          returnUrl: window.location.origin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to open billing portal' }
      }

      return { url: data.url }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to open portal' }
    }
  }

  const cancelSubscription = async () => {
    if (isDemo) {
      return { error: 'Billing is not available in demo mode' }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel-subscription' }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to cancel subscription' }
      }

      await fetchBillingData()
      return { success: true }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to cancel subscription' }
    }
  }

  const resumeSubscription = async () => {
    if (isDemo) {
      return { error: 'Billing is not available in demo mode' }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'resume-subscription' }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to resume subscription' }
      }

      await fetchBillingData()
      return { success: true }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to resume subscription' }
    }
  }

  return {
    subscription,
    billingHistory,
    plan,
    isActive,
    isTrialing,
    isCanceling,
    loading,
    error,
    createCheckout,
    openPortal,
    cancelSubscription,
    resumeSubscription,
    refresh: fetchBillingData,
  }
}
