/*
  # Agent Analytics & Insights System

  Creates comprehensive analytics system for tracking agent performance.

  ## New Tables
  - agent_conversation_metrics - Detailed metrics per conversation
  - agent_performance_snapshots - Aggregated performance by time period
  - conversation_satisfaction_ratings - User satisfaction ratings
  - agent_cost_breakdown - Detailed cost tracking
  - agent_improvement_recommendations - AI recommendations
  - agent_comparison_sessions - Saved comparisons
*/

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

ALTER TABLE agent_conversation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_satisfaction_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_improvement_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_comparison_sessions ENABLE ROW LEVEL SECURITY;

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