/*
  # AI Usage Logging for Billing

  1. New Tables
    - `ai_usage` - Tracks all AI API calls for billing and analytics
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles) - User who made the request
      - `swarm_id` (uuid, references swarms) - Swarm context
      - `agent_id` (uuid, references agents) - Agent that responded
      - `provider` (text) - AI provider (openai, anthropic, google, etc.)
      - `model` (text) - Model used (gpt-4o, claude-sonnet-4-20250514, etc.)
      - `input_tokens` (integer) - Tokens in the prompt
      - `output_tokens` (integer) - Tokens in the response
      - `total_tokens` (integer) - Total tokens used
      - `input_cost` (numeric) - Calculated input cost
      - `output_cost` (numeric) - Calculated output cost
      - `total_cost` (numeric) - Total cost for this request
      - `latency_ms` (integer) - Response time in milliseconds
      - `status` (text) - success, error, rate_limited, timeout
      - `error_code` (text) - Error code if failed
      - `error_message` (text) - Error details if failed
      - `request_metadata` (jsonb) - Additional request details
      - `created_at` (timestamptz) - When the request was made

  2. Security
    - Enable RLS
    - Users can view their own usage
    - Service role can insert/update

  3. Indexes
    - Index on user_id for user queries
    - Index on created_at for time-based queries
    - Index on swarm_id for swarm analytics
    - Index on provider for provider analytics

  4. Notes
    - Costs are calculated based on ai_models table pricing
    - Token counts may be estimated for streaming responses
*/

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE SET NULL,
  swarm_id uuid REFERENCES public.swarms ON DELETE SET NULL,
  agent_id uuid REFERENCES public.agents ON DELETE SET NULL,
  provider text NOT NULL,
  model text NOT NULL,
  input_tokens integer DEFAULT 0 NOT NULL,
  output_tokens integer DEFAULT 0 NOT NULL,
  total_tokens integer GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  input_cost numeric(10, 6) DEFAULT 0 NOT NULL,
  output_cost numeric(10, 6) DEFAULT 0 NOT NULL,
  total_cost numeric(10, 6) GENERATED ALWAYS AS (input_cost + output_cost) STORED,
  latency_ms integer DEFAULT 0,
  status text DEFAULT 'success' NOT NULL,
  error_code text,
  error_message text,
  request_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.ai_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage"
  ON public.ai_usage FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update usage"
  ON public.ai_usage FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_swarm_id ON public.ai_usage(swarm_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_agent_id ON public.ai_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON public.ai_usage(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_user_usage_summary(
  p_user_id uuid,
  p_start_date timestamptz DEFAULT (now() - interval '30 days'),
  p_end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  provider text,
  model text,
  request_count bigint,
  total_input_tokens bigint,
  total_output_tokens bigint,
  total_cost numeric,
  avg_latency_ms numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    provider,
    model,
    count(*)::bigint as request_count,
    sum(input_tokens)::bigint as total_input_tokens,
    sum(output_tokens)::bigint as total_output_tokens,
    sum(total_cost) as total_cost,
    avg(latency_ms)::numeric as avg_latency_ms
  FROM public.ai_usage
  WHERE user_id = p_user_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date
    AND status = 'success'
  GROUP BY provider, model
  ORDER BY total_cost DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_usage(
  p_user_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  date date,
  request_count bigint,
  total_tokens bigint,
  total_cost numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    date_trunc('day', created_at)::date as date,
    count(*)::bigint as request_count,
    sum(total_tokens)::bigint as total_tokens,
    sum(total_cost) as total_cost
  FROM public.ai_usage
  WHERE user_id = p_user_id
    AND created_at >= (now() - (p_days || ' days')::interval)
    AND status = 'success'
  GROUP BY date_trunc('day', created_at)::date
  ORDER BY date DESC;
$$;
