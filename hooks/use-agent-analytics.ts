'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ConversationMetric {
  id: string;
  agent_id: string;
  swarm_id: string;
  user_id: string;
  conversation_start: string;
  conversation_end: string | null;
  message_count: number;
  agent_message_count: number;
  avg_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
  total_tokens_used: number;
  total_cost_usd: number;
  success_status: 'success' | 'partial' | 'failed' | 'abandoned';
  error_count: number;
  tool_executions: number;
  context_switches: number;
  satisfaction_rating: number | null;
  created_at: string;
}

export interface PerformanceSnapshot {
  id: string;
  agent_id: string;
  snapshot_date: string;
  snapshot_hour: number | null;
  period_type: 'hourly' | 'daily';
  total_conversations: number;
  successful_conversations: number;
  failed_conversations: number;
  avg_response_time_ms: number;
  avg_messages_per_conversation: number;
  total_tokens_used: number;
  total_cost_usd: number;
  avg_satisfaction_rating: number;
  total_tool_executions: number;
  error_rate: number;
  created_at: string;
}

export interface SatisfactionRating {
  id: string;
  conversation_metric_id: string;
  agent_id: string;
  swarm_id: string;
  user_id: string;
  rating: number;
  feedback_text: string;
  feedback_categories: string[];
  would_recommend: boolean;
  created_at: string;
}

export interface CostBreakdown {
  id: string;
  agent_id: string;
  conversation_metric_id: string;
  message_id: string;
  model_name: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_per_input_token: number;
  cost_per_output_token: number;
  total_cost_usd: number;
  response_time_ms: number;
  created_at: string;
}

export interface ImprovementRecommendation {
  id: string;
  agent_id: string;
  recommendation_type: 'response_time' | 'accuracy' | 'cost' | 'satisfaction' | 'tools' | 'prompts';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metrics_analyzed: any;
  expected_improvement: string;
  status: 'pending' | 'acknowledged' | 'implemented' | 'dismissed';
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
}

export interface AgentAnalyticsSummary {
  totalConversations: number;
  successRate: number;
  avgResponseTime: number;
  avgSatisfaction: number;
  totalCost: number;
  avgCostPerConversation: number;
  totalTokens: number;
  toolExecutions: number;
  errorRate: number;
}

export function useAgentAnalytics(agentId: string, dateRange?: { start: Date; end: Date }) {
  const [metrics, setMetrics] = useState<ConversationMetric[]>([]);
  const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([]);
  const [summary, setSummary] = useState<AgentAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!agentId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('agent_conversation_metrics')
        .select('*')
        .eq('agent_id', agentId)
        .order('conversation_start', { ascending: false });

      if (dateRange) {
        query = query
          .gte('conversation_start', dateRange.start.toISOString())
          .lte('conversation_start', dateRange.end.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setMetrics(data || []);

      const summaryData: AgentAnalyticsSummary = {
        totalConversations: data?.length || 0,
        successRate: data?.length
          ? (data.filter((m) => m.success_status === 'success').length / data.length) * 100
          : 0,
        avgResponseTime: data?.length
          ? data.reduce((sum, m) => sum + m.avg_response_time_ms, 0) / data.length
          : 0,
        avgSatisfaction: data?.length
          ? data.reduce((sum, m) => sum + (m.satisfaction_rating || 0), 0) /
            data.filter((m) => m.satisfaction_rating).length
          : 0,
        totalCost: data?.reduce((sum, m) => sum + Number(m.total_cost_usd), 0) || 0,
        avgCostPerConversation: data?.length
          ? (data.reduce((sum, m) => sum + Number(m.total_cost_usd), 0) || 0) / data.length
          : 0,
        totalTokens: data?.reduce((sum, m) => sum + m.total_tokens_used, 0) || 0,
        toolExecutions: data?.reduce((sum, m) => sum + m.tool_executions, 0) || 0,
        errorRate: data?.length
          ? (data.reduce((sum, m) => sum + m.error_count, 0) /
              data.reduce((sum, m) => sum + m.message_count, 0)) *
            100
          : 0,
      };

      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [agentId, dateRange]);

  const fetchSnapshots = useCallback(
    async (periodType: 'hourly' | 'daily' = 'daily') => {
      if (!agentId) return;

      try {
        let query = supabase
          .from('agent_performance_snapshots')
          .select('*')
          .eq('agent_id', agentId)
          .eq('period_type', periodType)
          .order('snapshot_date', { ascending: false });

        if (dateRange) {
          query = query
            .gte('snapshot_date', dateRange.start.toISOString().split('T')[0])
            .lte('snapshot_date', dateRange.end.toISOString().split('T')[0]);
        }

        const { data, error } = await query.limit(30);

        if (error) throw error;
        setSnapshots(data || []);
      } catch (error) {
        console.error('Error fetching snapshots:', error);
      }
    },
    [agentId, dateRange]
  );

  useEffect(() => {
    fetchMetrics();
    fetchSnapshots();
  }, [fetchMetrics, fetchSnapshots]);

  return {
    metrics,
    snapshots,
    summary,
    loading,
    refetch: fetchMetrics,
    refetchSnapshots: fetchSnapshots,
  };
}

export function useAgentCosts(agentId: string, dateRange?: { start: Date; end: Date }) {
  const [costs, setCosts] = useState<CostBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCosts = useCallback(async () => {
    if (!agentId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('agent_cost_breakdown')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setCosts(data || []);
    } catch (error) {
      console.error('Error fetching costs:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId, dateRange]);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  const costByModel = costs.reduce((acc, cost) => {
    const model = cost.model_name || 'Unknown';
    acc[model] = (acc[model] || 0) + Number(cost.total_cost_usd);
    return acc;
  }, {} as Record<string, number>);

  const costByProvider = costs.reduce((acc, cost) => {
    const provider = cost.provider || 'Unknown';
    acc[provider] = (acc[provider] || 0) + Number(cost.total_cost_usd);
    return acc;
  }, {} as Record<string, number>);

  return {
    costs,
    costByModel,
    costByProvider,
    loading,
    refetch: fetchCosts,
  };
}

export function useAgentRecommendations(agentId: string) {
  const [recommendations, setRecommendations] = useState<ImprovementRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    if (!agentId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_improvement_recommendations')
        .select('*')
        .eq('agent_id', agentId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const acknowledgeRecommendation = async (recommendationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('agent_improvement_recommendations')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
        })
        .eq('id', recommendationId);

      if (error) throw error;

      toast.success('Recommendation acknowledged');
      fetchRecommendations();
    } catch (error) {
      console.error('Error acknowledging recommendation:', error);
      toast.error('Failed to acknowledge recommendation');
    }
  };

  const dismissRecommendation = async (recommendationId: string) => {
    try {
      const { error } = await supabase
        .from('agent_improvement_recommendations')
        .update({ status: 'dismissed' })
        .eq('id', recommendationId);

      if (error) throw error;

      toast.success('Recommendation dismissed');
      fetchRecommendations();
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
      toast.error('Failed to dismiss recommendation');
    }
  };

  const markImplemented = async (recommendationId: string) => {
    try {
      const { error } = await supabase
        .from('agent_improvement_recommendations')
        .update({ status: 'implemented' })
        .eq('id', recommendationId);

      if (error) throw error;

      toast.success('Recommendation marked as implemented');
      fetchRecommendations();
    } catch (error) {
      console.error('Error marking recommendation:', error);
      toast.error('Failed to mark recommendation');
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    refetch: fetchRecommendations,
    acknowledgeRecommendation,
    dismissRecommendation,
    markImplemented,
  };
}

export function useSatisfactionRatings(agentId: string) {
  const [ratings, setRatings] = useState<SatisfactionRating[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRatings = useCallback(async () => {
    if (!agentId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversation_satisfaction_ratings')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const submitRating = async (
    swarmId: string,
    conversationMetricId: string | null,
    ratingData: {
      rating: number;
      feedback_text?: string;
      feedback_categories?: string[];
      would_recommend?: boolean;
    }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('conversation_satisfaction_ratings')
        .insert({
          conversation_metric_id: conversationMetricId,
          agent_id: agentId,
          swarm_id: swarmId,
          user_id: user.id,
          ...ratingData,
        });

      if (error) throw error;

      if (conversationMetricId) {
        await supabase
          .from('agent_conversation_metrics')
          .update({ satisfaction_rating: ratingData.rating })
          .eq('id', conversationMetricId);
      }

      toast.success('Thank you for your feedback!');
      fetchRatings();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: ratings.filter((r) => r.rating === stars).length,
    percentage: ratings.length > 0
      ? (ratings.filter((r) => r.rating === stars).length / ratings.length) * 100
      : 0,
  }));

  const recommendationRate =
    ratings.length > 0
      ? (ratings.filter((r) => r.would_recommend).length / ratings.length) * 100
      : 0;

  return {
    ratings,
    avgRating,
    ratingDistribution,
    recommendationRate,
    loading,
    refetch: fetchRatings,
    submitRating,
  };
}

export function useAgentComparison(agentIds: string[], dateRange?: { start: Date; end: Date }) {
  const [comparison, setComparison] = useState<Record<string, AgentAnalyticsSummary>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      if (agentIds.length === 0) return;

      setLoading(true);
      try {
        const results: Record<string, AgentAnalyticsSummary> = {};

        for (const agentId of agentIds) {
          let query = supabase
            .from('agent_conversation_metrics')
            .select('*')
            .eq('agent_id', agentId);

          if (dateRange) {
            query = query
              .gte('conversation_start', dateRange.start.toISOString())
              .lte('conversation_start', dateRange.end.toISOString());
          }

          const { data, error } = await query;

          if (error) throw error;

          results[agentId] = {
            totalConversations: data?.length || 0,
            successRate: data?.length
              ? (data.filter((m) => m.success_status === 'success').length / data.length) * 100
              : 0,
            avgResponseTime: data?.length
              ? data.reduce((sum, m) => sum + m.avg_response_time_ms, 0) / data.length
              : 0,
            avgSatisfaction: data?.length
              ? data.reduce((sum, m) => sum + (m.satisfaction_rating || 0), 0) /
                data.filter((m) => m.satisfaction_rating).length || 0
              : 0,
            totalCost: data?.reduce((sum, m) => sum + Number(m.total_cost_usd), 0) || 0,
            avgCostPerConversation: data?.length
              ? (data.reduce((sum, m) => sum + Number(m.total_cost_usd), 0) || 0) / data.length
              : 0,
            totalTokens: data?.reduce((sum, m) => sum + m.total_tokens_used, 0) || 0,
            toolExecutions: data?.reduce((sum, m) => sum + m.tool_executions, 0) || 0,
            errorRate: data?.length
              ? (data.reduce((sum, m) => sum + m.error_count, 0) /
                  data.reduce((sum, m) => sum + m.message_count, 0)) *
                100
              : 0,
          };
        }

        setComparison(results);
      } catch (error) {
        console.error('Error fetching comparison:', error);
        toast.error('Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [agentIds, dateRange]);

  return {
    comparison,
    loading,
  };
}
