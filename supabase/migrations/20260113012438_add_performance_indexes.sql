/*
  # Performance Indexing Review & Optimization

  This migration adds indexes for commonly queried fields to optimize database
  performance with large datasets.
*/

CREATE INDEX IF NOT EXISTS idx_messages_swarm_created
  ON public.messages(swarm_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_type
  ON public.messages(sender_type);

CREATE INDEX IF NOT EXISTS idx_messages_signature_status
  ON public.messages(signature_status);

CREATE INDEX IF NOT EXISTS idx_messages_swarm_signature
  ON public.messages(swarm_id, signature_status);

CREATE INDEX IF NOT EXISTS idx_swarm_agents_agent_id
  ON public.swarm_agents(agent_id);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_swarms_user_status
  ON public.swarms(user_id, status);

CREATE INDEX IF NOT EXISTS idx_swarms_user_created
  ON public.swarms(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agents_user_created
  ON public.agents(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agents_user_status
  ON public.agents(user_id, status);

CREATE INDEX IF NOT EXISTS idx_billing_history_status
  ON public.billing_history(status);

CREATE INDEX IF NOT EXISTS idx_webhook_events_user_created
  ON public.webhook_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_summaries_period_type
  ON public.usage_summaries(period_type);

CREATE INDEX IF NOT EXISTS idx_tool_usage_swarm_started
  ON public.tool_usage(swarm_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_created
  ON public.ai_usage(provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_status
  ON public.ai_usage(status);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_created
  ON public.error_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_created
  ON public.webhook_deliveries(webhook_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_success
  ON public.webhook_deliveries(success);

CREATE INDEX IF NOT EXISTS idx_integrations_user_provider
  ON public.integrations(user_id, provider);

CREATE INDEX IF NOT EXISTS idx_context_blocks_swarm_priority
  ON public.context_blocks(swarm_id, priority);

CREATE INDEX IF NOT EXISTS idx_agent_presence_swarm_status
  ON public.agent_presence(swarm_id, status);

CREATE INDEX IF NOT EXISTS idx_swarm_tools_tool_swarm
  ON public.swarm_tools(tool_id, swarm_id);

CREATE INDEX IF NOT EXISTS idx_blog_posts_author
  ON public.blog_posts(author_id);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_date
  ON public.blog_posts(status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created
  ON public.rate_limit_events(created_at);