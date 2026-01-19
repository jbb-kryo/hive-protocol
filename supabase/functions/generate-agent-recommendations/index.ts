import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { agentId } = await req.json();
    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Missing agentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: metrics, error: metricsError } = await supabase
      .from('agent_conversation_metrics')
      .select('*')
      .eq('agent_id', agentId)
      .order('conversation_start', { ascending: false })
      .limit(100);

    if (metricsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch metrics' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recommendations = [];

    if (metrics && metrics.length > 0) {
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.avg_response_time_ms, 0) / metrics.length;
      const successRate = (metrics.filter(m => m.success_status === 'success').length / metrics.length) * 100;
      const avgSatisfaction = metrics.filter(m => m.satisfaction_rating).reduce((sum, m) => sum + (m.satisfaction_rating || 0), 0) / metrics.filter(m => m.satisfaction_rating).length || 0;
      const avgCost = metrics.reduce((sum, m) => sum + Number(m.total_cost_usd), 0) / metrics.length;
      const errorRate = (metrics.reduce((sum, m) => sum + m.error_count, 0) / metrics.reduce((sum, m) => sum + m.message_count, 0)) * 100;

      if (avgResponseTime > 2000) {
        recommendations.push({
          agent_id: agentId,
          recommendation_type: 'response_time',
          priority: avgResponseTime > 5000 ? 'high' : 'medium',
          title: 'Optimize Response Time',
          description: `Your agent has an average response time of ${Math.round(avgResponseTime)}ms, which is above the recommended threshold. Consider using a faster model, optimizing your system prompt, or reducing token usage.`,
          metrics_analyzed: { avgResponseTime, threshold: 2000 },
          expected_improvement: 'Reducing response time to under 2 seconds can improve user satisfaction by up to 30%.',
          status: 'pending',
        });
      }

      if (successRate < 85) {
        recommendations.push({
          agent_id: agentId,
          recommendation_type: 'accuracy',
          priority: successRate < 70 ? 'high' : 'medium',
          title: 'Improve Success Rate',
          description: `Your agent has a ${successRate.toFixed(1)}% success rate. Review failed conversations to identify common issues. Consider refining your system prompt, adding error handling, or providing more context.`,
          metrics_analyzed: { successRate, threshold: 85 },
          expected_improvement: 'Improving success rate to 90%+ will significantly enhance user trust and reduce support burden.',
          status: 'pending',
        });
      }

      if (avgSatisfaction > 0 && avgSatisfaction < 4.0) {
        recommendations.push({
          agent_id: agentId,
          recommendation_type: 'satisfaction',
          priority: avgSatisfaction < 3.0 ? 'high' : 'medium',
          title: 'Improve User Satisfaction',
          description: `Your agent has an average satisfaction rating of ${avgSatisfaction.toFixed(1)}/5.0. Analyze user feedback to understand pain points. Common issues include unclear responses, incomplete answers, or tone mismatches.`,
          metrics_analyzed: { avgSatisfaction, threshold: 4.0 },
          expected_improvement: 'Achieving 4.0+ satisfaction rating typically results in higher user retention and engagement.',
          status: 'pending',
        });
      }

      if (avgCost > 0.10) {
        recommendations.push({
          agent_id: agentId,
          recommendation_type: 'cost',
          priority: avgCost > 0.50 ? 'high' : 'low',
          title: 'Optimize Cost Efficiency',
          description: `Your agent costs an average of $${avgCost.toFixed(4)} per conversation. Consider using a more cost-effective model, reducing max_tokens, or optimizing your system prompt to use fewer tokens.`,
          metrics_analyzed: { avgCost, threshold: 0.10 },
          expected_improvement: 'Reducing costs by 30-50% is often achievable without sacrificing quality by optimizing token usage.',
          status: 'pending',
        });
      }

      if (errorRate > 5) {
        recommendations.push({
          agent_id: agentId,
          recommendation_type: 'accuracy',
          priority: errorRate > 10 ? 'high' : 'medium',
          title: 'Reduce Error Rate',
          description: `Your agent has a ${errorRate.toFixed(2)}% error rate. Review error logs to identify common failure patterns. Consider adding input validation, improving error handling, or refining tool configurations.`,
          metrics_analyzed: { errorRate, threshold: 5 },
          expected_improvement: 'Reducing errors below 5% will improve reliability and user confidence.',
          status: 'pending',
        });
      }

      const avgToolExecutions = metrics.reduce((sum, m) => sum + m.tool_executions, 0) / metrics.length;
      if (avgToolExecutions < 1 && metrics.some(m => m.tool_executions > 0)) {
        recommendations.push({
          agent_id: agentId,
          recommendation_type: 'tools',
          priority: 'low',
          title: 'Encourage Tool Usage',
          description: 'Your agent rarely uses available tools. Review your system prompt to better encourage tool usage when appropriate, or remove unused tools to reduce complexity.',
          metrics_analyzed: { avgToolExecutions },
          expected_improvement: 'Proper tool usage can significantly improve agent capabilities and reduce reliance on model knowledge.',
          status: 'pending',
        });
      }
    }

    if (recommendations.length > 0) {
      const { error: insertError } = await supabase
        .from('agent_improvement_recommendations')
        .insert(recommendations);

      if (insertError) {
        console.error('Error inserting recommendations:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: recommendations.length,
        recommendations,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});