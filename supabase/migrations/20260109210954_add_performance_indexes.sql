/*
  # Performance Indexing Review & Optimization

  This migration adds indexes for commonly queried fields to optimize database
  performance with large datasets.

  ## New Indexes

  ### Messages Table
  - Composite index on (swarm_id, created_at DESC) for paginated message loading
  - Index on sender_type for filtering by message source
  - Index on signature_status for verification filtering

  ### Swarm Agents Table
  - Index on agent_id for reverse lookups (find swarms for an agent)

  ### Profiles Table
  - Index on created_at for admin user listing queries

  ### Swarms Table
  - Composite index on (user_id, status) for filtered dashboard queries
  - Composite index on (user_id, created_at DESC) for recent swarms

  ### Agents Table
  - Composite index on (user_id, created_at DESC) for recent agents
  - Composite index on (user_id, status) for filtered agent queries

  ### Billing History Table
  - Index on status for filtering by payment status

  ### Webhook Events Table
  - Composite index on (user_id, created_at DESC) for user event history

  ### Usage Summaries Table
  - Index on period_type for filtering

  ## Index Design Decisions

  1. **Composite indexes** are used where queries frequently filter on multiple
     columns together (e.g., user_id + created_at for pagination)

  2. **DESC ordering** on timestamp columns optimizes queries that fetch
     recent records first (most common access pattern)

  3. **Partial indexes** are avoided in favor of regular indexes for
     simplicity and broader query support

  4. All indexes use IF NOT EXISTS to ensure idempotency
*/

-- Messages table: Composite index for efficient message pagination within a swarm
CREATE INDEX IF NOT EXISTS idx_messages_swarm_created
  ON public.messages(swarm_id, created_at DESC);

-- Messages table: Index on sender_type for filtering agent/human/system messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_type
  ON public.messages(sender_type);

-- Messages table: Index on signature_status for verification queries
CREATE INDEX IF NOT EXISTS idx_messages_signature_status
  ON public.messages(signature_status);

-- Messages table: Composite index for verification stats per swarm
CREATE INDEX IF NOT EXISTS idx_messages_swarm_signature
  ON public.messages(swarm_id, signature_status);

-- Swarm agents: Index on agent_id for finding which swarms an agent belongs to
CREATE INDEX IF NOT EXISTS idx_swarm_agents_agent_id
  ON public.swarm_agents(agent_id);

-- Profiles: Index on created_at for admin queries listing users by join date
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles(created_at DESC);

-- Swarms: Composite index for user's swarms filtered by status
CREATE INDEX IF NOT EXISTS idx_swarms_user_status
  ON public.swarms(user_id, status);

-- Swarms: Composite index for user's recent swarms
CREATE INDEX IF NOT EXISTS idx_swarms_user_created
  ON public.swarms(user_id, created_at DESC);

-- Agents: Composite index for user's recent agents
CREATE INDEX IF NOT EXISTS idx_agents_user_created
  ON public.agents(user_id, created_at DESC);

-- Agents: Composite index for user's agents filtered by status
CREATE INDEX IF NOT EXISTS idx_agents_user_status
  ON public.agents(user_id, status);

-- Billing history: Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_billing_history_status
  ON public.billing_history(status);

-- Webhook events: Composite index for user event history
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_created
  ON public.webhook_events(user_id, created_at DESC);

-- Usage summaries: Index on period_type for filtering
CREATE INDEX IF NOT EXISTS idx_usage_summaries_period_type
  ON public.usage_summaries(period_type);

-- Tool usage: Composite index for finding tool usage by swarm
CREATE INDEX IF NOT EXISTS idx_tool_usage_swarm_started
  ON public.tool_usage(swarm_id, started_at DESC);

-- AI usage: Composite index for cost analysis by provider
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_created
  ON public.ai_usage(provider, created_at DESC);

-- AI usage: Index on status for filtering successful/failed requests
CREATE INDEX IF NOT EXISTS idx_ai_usage_status
  ON public.ai_usage(status);

-- Error logs: Composite index for user error history
CREATE INDEX IF NOT EXISTS idx_error_logs_user_created
  ON public.error_logs(user_id, created_at DESC);

-- Webhook deliveries: Composite index for delivery history per webhook
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_created
  ON public.webhook_deliveries(webhook_id, created_at DESC);

-- Webhook deliveries: Index on success for filtering
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_success
  ON public.webhook_deliveries(success);

-- Integrations: Composite index for user integrations by provider
CREATE INDEX IF NOT EXISTS idx_integrations_user_provider
  ON public.integrations(user_id, provider);

-- Context blocks: Composite index for swarm context by priority
CREATE INDEX IF NOT EXISTS idx_context_blocks_swarm_priority
  ON public.context_blocks(swarm_id, priority);

-- Agent presence: Composite index for active agents in a swarm
CREATE INDEX IF NOT EXISTS idx_agent_presence_swarm_status
  ON public.agent_presence(swarm_id, status);

-- Swarm tools: Index for finding swarms using a specific tool
CREATE INDEX IF NOT EXISTS idx_swarm_tools_tool_swarm
  ON public.swarm_tools(tool_id, swarm_id);

-- Blog posts: Index on author for filtering by author
CREATE INDEX IF NOT EXISTS idx_blog_posts_author
  ON public.blog_posts(author_id);

-- Blog posts: Composite index for published posts by date
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_date
  ON public.blog_posts(status, published_at DESC)
  WHERE status = 'published';

-- Rate limit events: Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created
  ON public.rate_limit_events(created_at);
