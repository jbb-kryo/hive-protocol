/*
  # Agent Analytics & Insights System

  ## Overview
  This migration creates a comprehensive analytics system for tracking agent performance,
  including response times, success rates, user satisfaction, costs, and AI-powered recommendations.

  ## New Tables

  ### 1. `agent_conversation_metrics`
  Detailed metrics for each conversation with an agent
  - `id` (uuid, primary key)
  - `agent_id` (uuid, references agents)
  - `swarm_id` (uuid, references swarms)
  - `user_id` (uuid, references auth.users)
  - `conversation_start` (timestamptz) - When conversation started
  - `conversation_end` (timestamptz) - When conversation ended
  - `message_count` (integer) - Total messages in conversation
  - `agent_message_count` (integer) - Messages from agent
  - `avg_response_time_ms` (integer) - Average response time in milliseconds
  - `min_response_time_ms` (integer) - Fastest response time
  - `max_response_time_ms` (integer) - Slowest response time
  - `total_tokens_used` (integer) - Total tokens consumed
  - `total_cost_usd` (decimal) - Total cost in USD
  - `success_status` (text) - 'success', 'partial', 'failed', 'abandoned'
  - `error_count` (integer) - Number of errors encountered
  - `tool_executions` (integer) - Number of tools executed
  - `context_switches` (integer) - Number of context changes
  - `satisfaction_rating` (integer) - User rating 1-5 (null if not rated)
  - `created_at` (timestamptz)

  ### 2. `agent_performance_snapshots`
  Aggregated performance metrics by time period
  - `id` (uuid, primary key)
  - `agent_id` (uuid, references agents)
  - `snapshot_date` (date) - Date of snapshot
  - `snapshot_hour` (integer) - Hour of day (0-23, null for daily)
  - `period_type` (text) - 'hourly', 'daily'
  - `total_conversations` (integer) - Total conversations
  - `successful_conversations` (integer) - Successfully completed
  - `failed_conversations` (integer) - Failed conversations
  - `avg_response_time_ms` (integer) - Average response time
  - `avg_messages_per_conversation` (decimal) - Average messages
  - `total_tokens_used` (integer) - Total tokens
  - `total_cost_usd` (decimal) - Total cost
  - `avg_satisfaction_rating` (decimal) - Average satisfaction
  - `total_tool_executions` (integer) - Total tools executed
  - `error_rate` (decimal) - Percentage of errors
  - `created_at` (timestamptz)
  - UNIQUE constraint on (agent_id, snapshot_date, snapshot_hour, period_type)

  ### 3. `conversation_satisfaction_ratings`
  User satisfaction ratings and feedback
  - `id` (uuid, primary key)
  - `conversation_metric_id` (uuid, references agent_conversation_metrics)
  - `agent_id` (uuid, references agents)
  - `swarm_id` (uuid, references swarms)
  - `user_id` (uuid, references auth.users)
  - `rating` (integer) - 1-5 star rating
  - `feedback_text` (text) - Optional feedback
  - `feedback_categories` (text[]) - Tags like 'helpful', 'accurate', 'fast', 'confusing'
  - `would_recommend` (boolean) - Would recommend this agent
  - `created_at` (timestamptz)

  ### 4. `agent_cost_breakdown`
  Detailed cost tracking per interaction
  - `id` (uuid, primary key)
  - `agent_id` (uuid, references agents)
  - `conversation_metric_id` (uuid, references agent_conversation_metrics)
  - `message_id` (uuid, references messages)
  - `model_name` (text) - AI model used
  - `provider` (text) - AI provider (openai, anthropic, etc.)
  - `input_tokens` (integer) - Input tokens
  - `output_tokens` (integer) - Output tokens
  - `total_tokens` (integer) - Total tokens
  - `cost_per_input_token` (decimal) - Cost per input token
  - `cost_per_output_token` (decimal) - Cost per output token
  - `total_cost_usd` (decimal) - Total cost
  - `response_time_ms` (integer) - Response time in milliseconds
  - `created_at` (timestamptz)

  ### 5. `agent_improvement_recommendations`
  AI-generated recommendations for improving agent performance
  - `id` (uuid, primary key)
  - `agent_id` (uuid, references agents)
  - `recommendation_type` (text) - 'response_time', 'accuracy', 'cost', 'satisfaction'
  - `priority` (text) - 'high', 'medium', 'low'
  - `title` (text) - Recommendation title
  - `description` (text) - Detailed description
  - `metrics_analyzed` (jsonb) - Metrics that led to this recommendation
  - `expected_improvement` (text) - Expected impact
  - `status` (text) - 'pending', 'acknowledged', 'implemented', 'dismissed'
  - `acknowledged_at` (timestamptz)
  - `acknowledged_by` (uuid, references auth.users)
  - `created_at` (timestamptz)

  ### 6. `agent_comparison_sessions`
  Save agent comparison sessions for later reference
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text) - Session name
  - `agent_ids` (uuid[]) - Array of agent IDs being compared
  - `date_range_start` (date) - Comparison start date
  - `date_range_end` (date) - Comparison end date
  - `metrics_compared` (text[]) - Metrics included in comparison
  - `notes` (text) - User notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can view analytics for their own agents
  - Admins can view all analytics
  - Users can submit satisfaction ratings for conversations they participated in

  ## Indexes
  - Performance indexes on foreign keys and date columns
  - Indexes for common query patterns
*/

-- Agent conversation metrics table
CREATE TABLE IF NOT EXISTS agent_conversation_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  swarm_id uuid REFERENCES swarms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_start timestamptz NOT NULL,
  conversation_end timestamptz,
  message_count integer DEFAULT 0,
  agent_message_count integer DEFAULT 0,
  avg_response_time_ms integer DEFAULT 0,
  min_response_time_ms integer DEFAULT 0,
  max_response_time_ms integer DEFAULT 0,
  total_tokens_used integer DEFAULT 0,
  total_cost_usd decimal(10, 4) DEFAULT 0.0000,
  success_status text DEFAULT 'success' CHECK (success_status IN ('success', 'partial', 'failed', 'abandoned')),
  error_count integer DEFAULT 0,
  tool_executions integer DEFAULT 0,
  context_switches integer DEFAULT 0,
  satisfaction_rating integer CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5 OR satisfaction_rating IS NULL),
  created_at timestamptz DEFAULT now()
);

-- Agent performance snapshots table
CREATE TABLE IF NOT EXISTS agent_performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  snapshot_date date NOT NULL,
  snapshot_hour integer CHECK (snapshot_hour >= 0 AND snapshot_hour <= 23 OR snapshot_hour IS NULL),
  period_type text NOT NULL CHECK (period_type IN ('hourly', 'daily')),
  total_conversations integer DEFAULT 0,
  successful_conversations integer DEFAULT 0,
  failed_conversations integer DEFAULT 0,
  avg_response_time_ms integer DEFAULT 0,
  avg_messages_per_conversation decimal(10, 2) DEFAULT 0.00,
  total_tokens_used integer DEFAULT 0,
  total_cost_usd decimal(10, 4) DEFAULT 0.0000,
  avg_satisfaction_rating decimal(3, 2) DEFAULT 0.00,
  total_tool_executions integer DEFAULT 0,
  error_rate decimal(5, 2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, snapshot_date, snapshot_hour, period_type)
);

-- Conversation satisfaction ratings table
CREATE TABLE IF NOT EXISTS conversation_satisfaction_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_metric_id uuid REFERENCES agent_conversation_metrics(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  swarm_id uuid REFERENCES swarms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text DEFAULT '',
  feedback_categories text[] DEFAULT '{}',
  would_recommend boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Agent cost breakdown table
CREATE TABLE IF NOT EXISTS agent_cost_breakdown (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  conversation_metric_id uuid REFERENCES agent_conversation_metrics(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  model_name text DEFAULT '',
  provider text DEFAULT '',
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  cost_per_input_token decimal(10, 8) DEFAULT 0.00000000,
  cost_per_output_token decimal(10, 8) DEFAULT 0.00000000,
  total_cost_usd decimal(10, 4) DEFAULT 0.0000,
  response_time_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Agent improvement recommendations table
CREATE TABLE IF NOT EXISTS agent_improvement_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  recommendation_type text NOT NULL CHECK (recommendation_type IN ('response_time', 'accuracy', 'cost', 'satisfaction', 'tools', 'prompts')),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  title text NOT NULL,
  description text DEFAULT '',
  metrics_analyzed jsonb DEFAULT '{}',
  expected_improvement text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'implemented', 'dismissed')),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Agent comparison sessions table
CREATE TABLE IF NOT EXISTS agent_comparison_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  agent_ids uuid[] DEFAULT '{}',
  date_range_start date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  date_range_end date DEFAULT CURRENT_DATE,
  metrics_compared text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_agent ON agent_conversation_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_swarm ON agent_conversation_metrics(swarm_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_user ON agent_conversation_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_dates ON agent_conversation_metrics(conversation_start, conversation_end);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_status ON agent_conversation_metrics(success_status);

CREATE INDEX IF NOT EXISTS idx_performance_snapshots_agent ON agent_performance_snapshots(agent_id);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_date ON agent_performance_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_period ON agent_performance_snapshots(period_type);

CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_agent ON conversation_satisfaction_ratings(agent_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_rating ON conversation_satisfaction_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_user ON conversation_satisfaction_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_cost_breakdown_agent ON agent_cost_breakdown(agent_id);
CREATE INDEX IF NOT EXISTS idx_cost_breakdown_conversation ON agent_cost_breakdown(conversation_metric_id);
CREATE INDEX IF NOT EXISTS idx_cost_breakdown_message ON agent_cost_breakdown(message_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_agent ON agent_improvement_recommendations(agent_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON agent_improvement_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON agent_improvement_recommendations(priority);

CREATE INDEX IF NOT EXISTS idx_comparison_sessions_user ON agent_comparison_sessions(user_id);

-- Enable RLS on all tables
ALTER TABLE agent_conversation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_satisfaction_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_improvement_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_comparison_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_conversation_metrics
CREATE POLICY "Users can view metrics for their own agents"
  ON agent_conversation_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_conversation_metrics.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create conversation metrics"
  ON agent_conversation_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_conversation_metrics.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metrics for their conversations"
  ON agent_conversation_metrics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_conversation_metrics.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- RLS Policies for agent_performance_snapshots
CREATE POLICY "Users can view snapshots for their own agents"
  ON agent_performance_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_performance_snapshots.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- RLS Policies for conversation_satisfaction_ratings
CREATE POLICY "Users can view ratings for their own agents"
  ON conversation_satisfaction_ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = conversation_satisfaction_ratings.agent_id
      AND agents.user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can create ratings for their conversations"
  ON conversation_satisfaction_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for agent_cost_breakdown
CREATE POLICY "Users can view costs for their own agents"
  ON agent_cost_breakdown FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_cost_breakdown.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- RLS Policies for agent_improvement_recommendations
CREATE POLICY "Users can view recommendations for their own agents"
  ON agent_improvement_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_improvement_recommendations.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recommendations for their own agents"
  ON agent_improvement_recommendations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_improvement_recommendations.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- RLS Policies for agent_comparison_sessions
CREATE POLICY "Users can view own comparison sessions"
  ON agent_comparison_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create comparison sessions"
  ON agent_comparison_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comparison sessions"
  ON agent_comparison_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comparison sessions"
  ON agent_comparison_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
