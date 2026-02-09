'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
}

export interface MarketplaceAgent {
  id: string;
  creator_id: string;
  source_agent_id: string | null;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  category_id: string | null;
  category?: MarketplaceCategory;
  tags: string[];
  pricing_type: 'free' | 'one_time' | 'subscription';
  price_amount: number;
  billing_interval: 'monthly' | 'yearly' | null;
  configuration: any;
  icon_url: string;
  banner_url: string;
  is_published: boolean;
  is_featured: boolean;
  featured_until: string | null;
  version: string;
  install_count: number;
  view_count: number;
  average_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  creator?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface MarketplaceReview {
  id: string;
  agent_id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface MarketplacePurchase {
  id: string;
  agent_id: string;
  user_id: string;
  purchase_type: 'one_time' | 'subscription';
  amount_paid: number;
  currency: string;
  payment_provider: string;
  payment_id: string;
  subscription_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'refunded';
  billing_interval: 'monthly' | 'yearly' | null;
  current_period_start: string | null;
  current_period_end: string | null;
  auto_renew: boolean;
  installed_agent_id: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  expires_at: string | null;
  agent?: MarketplaceAgent;
}

export interface AgentAnalytics {
  date: string;
  views: number;
  unique_viewers: number;
  installs: number;
  purchases: number;
  revenue: number;
}

interface MarketplaceFilters {
  category?: string;
  pricing?: 'free' | 'paid' | 'all';
  search?: string;
  tags?: string[];
  sort?: 'popular' | 'newest' | 'rating' | 'price_low' | 'price_high';
}

export function useMarketplace() {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchAgents = useCallback(async (filters: MarketplaceFilters = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('marketplace_agents')
        .select(`
          *,
          category:marketplace_categories(*),
          creator:profiles!marketplace_agents_creator_id_fkey(full_name, avatar_url)
        `)
        .eq('is_published', true);

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.pricing === 'free') {
        query = query.eq('pricing_type', 'free');
      } else if (filters.pricing === 'paid') {
        query = query.in('pricing_type', ['one_time', 'subscription']);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      switch (filters.sort) {
        case 'popular':
          query = query.order('install_count', { ascending: false });
          break;
        case 'newest':
          query = query.order('published_at', { ascending: false });
          break;
        case 'rating':
          query = query.order('average_rating', { ascending: false });
          break;
        case 'price_low':
          query = query.order('price_amount', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price_amount', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  const getFeaturedAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_agents')
        .select(`
          *,
          category:marketplace_categories(*),
          creator:profiles!marketplace_agents_creator_id_fkey(full_name, avatar_url)
        `)
        .eq('is_published', true)
        .eq('is_featured', true)
        .gt('featured_until', new Date().toISOString())
        .order('install_count', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured agents:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchAgents();
  }, [fetchCategories, fetchAgents]);

  return {
    agents,
    categories,
    loading,
    fetchAgents,
    getFeaturedAgents,
    refetch: fetchAgents,
  };
}

export function useMarketplaceAgent(agentId: string) {
  const [agent, setAgent] = useState<MarketplaceAgent | null>(null);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_agents')
        .select(`
          *,
          category:marketplace_categories(*),
          creator:profiles!marketplace_agents_creator_id_fkey(full_name, avatar_url)
        `)
        .eq('id', agentId)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setAgent(data);

      await supabase
        .from('marketplace_agents')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', agentId);
    } catch (error) {
      console.error('Error fetching agent:', error);
      toast.error('Failed to load agent details');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_reviews')
        .select(`
          *,
          user:profiles!marketplace_reviews_user_id_fkey(full_name, avatar_url)
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
    fetchReviews();
  }, [fetchAgent, fetchReviews]);

  return {
    agent,
    reviews,
    loading,
    refetch: fetchAgent,
    refetchReviews: fetchReviews,
  };
}

export function useMarketplaceActions() {
  const [loading, setLoading] = useState(false);

  const getPublishedListingBySourceAgent = async (sourceAgentId: string): Promise<MarketplaceAgent | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('marketplace_agents')
        .select(`
          *,
          category:marketplace_categories(*)
        `)
        .eq('source_agent_id', sourceAgentId)
        .eq('creator_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching published listing:', error);
      return null;
    }
  };

  const publishAgent = async (agentId: string, marketplaceData: {
    name: string;
    slug: string;
    description: string;
    long_description: string;
    category_id: string;
    tags: string[];
    pricing_type: 'free' | 'one_time' | 'subscription';
    price_amount?: number;
    billing_interval?: 'monthly' | 'yearly';
    icon_url?: string;
    banner_url?: string;
  }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: sourceAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (!sourceAgent) throw new Error('Source agent not found');

      const configuration = {
        system_prompt: sourceAgent.system_prompt,
        model: sourceAgent.model,
        framework: sourceAgent.framework,
        role: sourceAgent.role,
        settings: sourceAgent.settings,
      };

      const { data, error } = await supabase
        .from('marketplace_agents')
        .insert({
          creator_id: user.id,
          source_agent_id: agentId,
          configuration,
          is_published: true,
          published_at: new Date().toISOString(),
          ...marketplaceData,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Agent published to marketplace!');
      return data;
    } catch (error) {
      console.error('Error publishing agent:', error);
      toast.error('Failed to publish agent');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unpublishAgent = async (listingId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_agents')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      toast.success('Agent removed from marketplace');
    } catch (error) {
      console.error('Error unpublishing agent:', error);
      toast.error('Failed to unpublish agent');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateMarketplaceAgent = async (agentId: string, updates: Partial<MarketplaceAgent>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_agents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', agentId);

      if (error) throw error;

      toast.success('Agent updated successfully');
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const installAgent = async (agentId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: marketplaceAgent } = await supabase
        .from('marketplace_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (!marketplaceAgent) throw new Error('Agent not found');

      const { data: newAgent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: marketplaceAgent.name,
          system_prompt: marketplaceAgent.configuration.system_prompt || '',
          model: marketplaceAgent.configuration.model || 'gpt-4',
          temperature: marketplaceAgent.configuration.temperature || 0.7,
          max_tokens: marketplaceAgent.configuration.max_tokens || 2000,
        })
        .select()
        .single();

      if (agentError) throw agentError;

      await supabase
        .from('marketplace_agents')
        .update({ install_count: (marketplaceAgent.install_count || 0) + 1 })
        .eq('id', agentId);

      toast.success('Agent installed successfully!');
      return newAgent;
    } catch (error) {
      console.error('Error installing agent:', error);
      toast.error('Failed to install agent');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (agentId: string, review: {
    rating: number;
    title: string;
    comment: string;
  }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: purchase } = await supabase
        .from('marketplace_purchases')
        .select('id')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .maybeSingle();

      const { error } = await supabase
        .from('marketplace_reviews')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          is_verified_purchase: !!purchase,
          ...review,
        });

      if (error) throw error;

      const { data: reviews } = await supabase
        .from('marketplace_reviews')
        .select('rating')
        .eq('agent_id', agentId);

      if (reviews) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabase
          .from('marketplace_agents')
          .update({
            average_rating: avgRating,
            review_count: reviews.length,
          })
          .eq('id', agentId);
      }

      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Error creating review:', error);
      toast.error('Failed to submit review');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (reviewId: string, updates: {
    rating?: number;
    title?: string;
    comment?: string;
  }) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_reviews')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Review updated successfully');
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const markReviewHelpful = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('marketplace_review_helpful')
        .insert({
          review_id: reviewId,
          user_id: user.id,
        });

      if (error) throw error;

      const { data: review } = await supabase
        .from('marketplace_reviews')
        .select('helpful_count')
        .eq('id', reviewId)
        .single();

      if (review) {
        await supabase
          .from('marketplace_reviews')
          .update({ helpful_count: (review.helpful_count || 0) + 1 })
          .eq('id', reviewId);
      }
    } catch (error) {
      console.error('Error marking review helpful:', error);
      toast.error('Failed to mark review as helpful');
    }
  };

  const getListingByTemplate = async (templateId: string): Promise<MarketplaceAgent | null> => {
    try {
      const { data, error } = await supabase
        .from('marketplace_agents')
        .select(`
          *,
          category:marketplace_categories(*)
        `)
        .eq('source_template_id', templateId)
        .eq('is_template_promoted', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template listing:', error);
      return null;
    }
  };

  const promoteTemplate = async (templateData: {
    templateId: string;
    name: string;
    slug: string;
    description: string;
    long_description: string;
    category_id: string;
    tags: string[];
    pricing_type: 'free' | 'one_time' | 'subscription';
    price_amount?: number;
    billing_interval?: 'monthly' | 'yearly';
    icon_url?: string;
    banner_url?: string;
    sync_enabled: boolean;
    configuration: Record<string, unknown>;
    version: string;
  }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('marketplace_agents')
        .insert({
          creator_id: user.id,
          source_template_id: templateData.templateId,
          source_agent_id: null,
          name: templateData.name,
          slug: templateData.slug,
          description: templateData.description,
          long_description: templateData.long_description,
          category_id: templateData.category_id,
          tags: templateData.tags,
          pricing_type: templateData.pricing_type,
          price_amount: templateData.price_amount || 0,
          billing_interval: templateData.billing_interval || null,
          icon_url: templateData.icon_url || '',
          banner_url: templateData.banner_url || '',
          configuration: templateData.configuration,
          version: templateData.version,
          is_published: true,
          is_template_promoted: true,
          template_sync_enabled: templateData.sync_enabled,
          published_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Template promoted to marketplace!');
      return data;
    } catch (error) {
      console.error('Error promoting template:', error);
      toast.error('Failed to promote template');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const syncTemplateToListing = async (templateId: string, templateData: {
    name: string;
    description?: string;
    version: string;
    configuration: Record<string, unknown>;
    tags?: string[];
  }) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_agents')
        .update({
          name: templateData.name,
          description: templateData.description,
          version: templateData.version,
          configuration: templateData.configuration,
          tags: templateData.tags,
          updated_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        })
        .eq('source_template_id', templateId)
        .eq('is_template_promoted', true)
        .eq('template_sync_enabled', true);

      if (error) throw error;

      toast.success('Marketplace listing synced');
    } catch (error) {
      console.error('Error syncing template:', error);
      toast.error('Failed to sync marketplace listing');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getTemplateMarketplaceStats = async (templateIds: string[]): Promise<Record<string, {
    listingId: string;
    installCount: number;
    viewCount: number;
    averageRating: number;
    reviewCount: number;
    pricingType: string;
    priceAmount: number;
    isPublished: boolean;
  }>> => {
    if (templateIds.length === 0) return {};
    try {
      const { data, error } = await supabase
        .from('marketplace_agents')
        .select('id, source_template_id, install_count, view_count, average_rating, review_count, pricing_type, price_amount, is_published')
        .in('source_template_id', templateIds)
        .eq('is_template_promoted', true);

      if (error) throw error;

      const stats: Record<string, {
        listingId: string;
        installCount: number;
        viewCount: number;
        averageRating: number;
        reviewCount: number;
        pricingType: string;
        priceAmount: number;
        isPublished: boolean;
      }> = {};

      for (const row of (data || [])) {
        if (row.source_template_id) {
          stats[row.source_template_id] = {
            listingId: row.id,
            installCount: row.install_count || 0,
            viewCount: row.view_count || 0,
            averageRating: row.average_rating || 0,
            reviewCount: row.review_count || 0,
            pricingType: row.pricing_type,
            priceAmount: row.price_amount || 0,
            isPublished: row.is_published,
          };
        }
      }
      return stats;
    } catch (error) {
      console.error('Error fetching template marketplace stats:', error);
      return {};
    }
  };

  return {
    loading,
    getPublishedListingBySourceAgent,
    getListingByTemplate,
    publishAgent,
    unpublishAgent,
    updateMarketplaceAgent,
    installAgent,
    createReview,
    updateReview,
    markReviewHelpful,
    promoteTemplate,
    syncTemplateToListing,
    getTemplateMarketplaceStats,
  };
}

export function useCreatorAnalytics(agentId: string) {
  const [analytics, setAnalytics] = useState<AgentAnalytics[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_agent_analytics')
        .select('*')
        .eq('agent_id', agentId)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;

      setAnalytics(data || []);
      const revenue = data?.reduce((sum, day) => sum + Number(day.revenue), 0) || 0;
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    totalRevenue,
    loading,
    refetch: fetchAnalytics,
  };
}

export function useMyPurchases() {
  const [purchases, setPurchases] = useState<MarketplacePurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('marketplace_purchases')
        .select(`
          *,
          agent:marketplace_agents(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return {
    purchases,
    loading,
    refetch: fetchPurchases,
  };
}
