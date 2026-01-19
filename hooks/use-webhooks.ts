'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Webhook {
  id: string;
  user_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export const WEBHOOK_EVENTS = [
  { id: 'message', label: 'New Message', description: 'When a new message is sent in a swarm' },
  { id: 'swarm_complete', label: 'Swarm Complete', description: 'When a swarm task is completed' },
  { id: 'agent_error', label: 'Agent Error', description: 'When an agent encounters an error' },
] as const;

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWebhooks([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setWebhooks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhooks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const createWebhook = async (webhook: { name: string; url: string; events: string[] }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error: createError } = await supabase
      .from('webhooks')
      .insert({
        user_id: user.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
      })
      .select()
      .single();

    if (createError) throw createError;
    setWebhooks(prev => [data, ...prev]);
    return data;
  };

  const updateWebhook = async (id: string, updates: Partial<Omit<Webhook, 'id' | 'user_id' | 'created_at'>>) => {
    const { data, error: updateError } = await supabase
      .from('webhooks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    setWebhooks(prev => prev.map(w => w.id === id ? data : w));
    return data;
  };

  const deleteWebhook = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const toggleWebhook = async (id: string, isActive: boolean) => {
    return updateWebhook(id, { is_active: isActive });
  };

  const regenerateSecret = async (id: string) => {
    const newSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return updateWebhook(id, { secret: newSecret });
  };

  return {
    webhooks,
    loading,
    error,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    toggleWebhook,
    regenerateSecret,
    refresh: fetchWebhooks,
  };
}

export function useWebhookDeliveries(webhookId: string | null) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    if (!webhookId) {
      setDeliveries([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDeliveries(data || []);
    } catch {
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [webhookId]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  return { deliveries, loading, refresh: fetchDeliveries };
}
