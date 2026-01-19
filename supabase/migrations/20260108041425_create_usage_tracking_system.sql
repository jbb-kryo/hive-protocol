/*
  # Create Usage Tracking System

  1. New Tables
    - `usage_summaries` - Aggregated usage per user per period
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User this summary belongs to
      - `period_start` (date) - Start of the period (day)
      - `period_type` (text) - Type of period (daily, monthly)
      - `messages_count` (integer) - Total messages sent
      - `ai_requests_count` (integer) - Total AI API requests
      - `tokens_used` (integer) - Total tokens consumed
      - `tokens_input` (integer) - Input tokens
      - `tokens_output` (integer) - Output tokens
      - `tool_executions` (integer) - Tool executions count
      - `estimated_cost` (numeric) - Estimated cost in USD
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to `plan_rate_limits`
    - Add `messages_per_day` column

  3. Functions
    - `get_user_usage` - Get current usage for a user
    - `check_rate_limit` - Check if user is within limits
    - `increment_usage` - Increment usage counters
    - `get_usage_stats` - Get usage statistics for dashboard

  4. Security
    - Enable RLS on usage_summaries
    - Users can only view their own usage
*/

CREATE TABLE IF NOT EXISTS public.usage_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  period_start date NOT NULL,
  period_type text NOT NULL DEFAULT 'daily',
  messages_count integer NOT NULL DEFAULT 0,
  ai_requests_count integer NOT NULL DEFAULT 0,
  tokens_used integer NOT NULL DEFAULT 0,
  tokens_input integer NOT NULL DEFAULT 0,
  tokens_output integer NOT NULL DEFAULT 0,
  tool_executions integer NOT NULL DEFAULT 0,
  estimated_cost numeric(10, 4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_period_type CHECK (period_type IN ('daily', 'monthly')),
  CONSTRAINT unique_user_period UNIQUE (user_id, period_start, period_type)
);

ALTER TABLE public.usage_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage summaries"
  ON public.usage_summaries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_usage_summaries_user_period 
  ON public.usage_summaries(user_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_usage_summaries_period_start 
  ON public.usage_summaries(period_start DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plan_rate_limits' AND column_name = 'messages_per_day'
  ) THEN
    ALTER TABLE public.plan_rate_limits ADD COLUMN messages_per_day integer DEFAULT 1000;
  END IF;
END $$;

UPDATE public.plan_rate_limits SET messages_per_day = 100 WHERE plan = 'free';
UPDATE public.plan_rate_limits SET messages_per_day = 1000 WHERE plan = 'pro';
UPDATE public.plan_rate_limits SET messages_per_day = 10000 WHERE plan = 'enterprise';

CREATE OR REPLACE FUNCTION public.get_or_create_daily_usage(p_user_id uuid)
RETURNS public.usage_summaries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_usage public.usage_summaries;
BEGIN
  SELECT * INTO v_usage
  FROM public.usage_summaries
  WHERE user_id = p_user_id
    AND period_start = v_today
    AND period_type = 'daily';

  IF NOT FOUND THEN
    INSERT INTO public.usage_summaries (user_id, period_start, period_type)
    VALUES (p_user_id, v_today, 'daily')
    ON CONFLICT (user_id, period_start, period_type) DO NOTHING
    RETURNING * INTO v_usage;

    IF v_usage IS NULL THEN
      SELECT * INTO v_usage
      FROM public.usage_summaries
      WHERE user_id = p_user_id
        AND period_start = v_today
        AND period_type = 'daily';
    END IF;
  END IF;

  RETURN v_usage;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_plan_limits(p_user_id uuid)
RETURNS TABLE(
  plan text,
  requests_per_minute integer,
  requests_per_day integer,
  tokens_per_day integer,
  messages_per_day integer,
  max_agents integer,
  max_swarms integer
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_plan text;
BEGIN
  SELECT p.plan INTO v_user_plan
  FROM public.profiles p
  WHERE p.id = p_user_id;

  IF v_user_plan IS NULL THEN
    v_user_plan := 'free';
  END IF;

  RETURN QUERY
  SELECT 
    prl.plan,
    prl.requests_per_minute,
    prl.requests_per_day,
    prl.tokens_per_day,
    prl.messages_per_day,
    prl.max_agents,
    prl.max_swarms
  FROM public.plan_rate_limits prl
  WHERE prl.plan = v_user_plan;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_check_type text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage public.usage_summaries;
  v_limits record;
  v_result jsonb;
  v_allowed boolean := true;
  v_reason text := null;
  v_current_agents integer;
  v_current_swarms integer;
BEGIN
  v_usage := public.get_or_create_daily_usage(p_user_id);
  
  SELECT * INTO v_limits
  FROM public.get_user_plan_limits(p_user_id);

  IF v_limits IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', null,
      'usage', jsonb_build_object(),
      'limits', jsonb_build_object()
    );
  END IF;

  IF p_check_type IN ('all', 'messages') THEN
    IF v_usage.messages_count >= v_limits.messages_per_day THEN
      v_allowed := false;
      v_reason := 'Daily message limit exceeded';
    END IF;
  END IF;

  IF v_allowed AND p_check_type IN ('all', 'requests') THEN
    IF v_usage.ai_requests_count >= v_limits.requests_per_day THEN
      v_allowed := false;
      v_reason := 'Daily API request limit exceeded';
    END IF;
  END IF;

  IF v_allowed AND p_check_type IN ('all', 'tokens') THEN
    IF v_usage.tokens_used >= v_limits.tokens_per_day THEN
      v_allowed := false;
      v_reason := 'Daily token limit exceeded';
    END IF;
  END IF;

  IF v_allowed AND p_check_type IN ('all', 'agents') THEN
    SELECT COUNT(*) INTO v_current_agents
    FROM public.agents
    WHERE user_id = p_user_id;

    IF v_current_agents >= v_limits.max_agents THEN
      v_allowed := false;
      v_reason := 'Maximum agent limit reached';
    END IF;
  END IF;

  IF v_allowed AND p_check_type IN ('all', 'swarms') THEN
    SELECT COUNT(*) INTO v_current_swarms
    FROM public.swarms
    WHERE user_id = p_user_id;

    IF v_current_swarms >= v_limits.max_swarms THEN
      v_allowed := false;
      v_reason := 'Maximum swarm limit reached';
    END IF;
  END IF;

  v_result := jsonb_build_object(
    'allowed', v_allowed,
    'reason', v_reason,
    'usage', jsonb_build_object(
      'messages', v_usage.messages_count,
      'requests', v_usage.ai_requests_count,
      'tokens', v_usage.tokens_used,
      'tokens_input', v_usage.tokens_input,
      'tokens_output', v_usage.tokens_output,
      'tool_executions', v_usage.tool_executions,
      'estimated_cost', v_usage.estimated_cost
    ),
    'limits', jsonb_build_object(
      'plan', v_limits.plan,
      'messages_per_day', v_limits.messages_per_day,
      'requests_per_day', v_limits.requests_per_day,
      'tokens_per_day', v_limits.tokens_per_day,
      'max_agents', v_limits.max_agents,
      'max_swarms', v_limits.max_swarms
    ),
    'period_start', v_usage.period_start
  );

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id uuid,
  p_messages integer DEFAULT 0,
  p_requests integer DEFAULT 0,
  p_tokens_input integer DEFAULT 0,
  p_tokens_output integer DEFAULT 0,
  p_tool_executions integer DEFAULT 0,
  p_cost numeric DEFAULT 0
)
RETURNS public.usage_summaries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_usage public.usage_summaries;
BEGIN
  INSERT INTO public.usage_summaries (
    user_id, 
    period_start, 
    period_type,
    messages_count,
    ai_requests_count,
    tokens_input,
    tokens_output,
    tokens_used,
    tool_executions,
    estimated_cost
  )
  VALUES (
    p_user_id,
    v_today,
    'daily',
    p_messages,
    p_requests,
    p_tokens_input,
    p_tokens_output,
    p_tokens_input + p_tokens_output,
    p_tool_executions,
    p_cost
  )
  ON CONFLICT (user_id, period_start, period_type) 
  DO UPDATE SET
    messages_count = usage_summaries.messages_count + p_messages,
    ai_requests_count = usage_summaries.ai_requests_count + p_requests,
    tokens_input = usage_summaries.tokens_input + p_tokens_input,
    tokens_output = usage_summaries.tokens_output + p_tokens_output,
    tokens_used = usage_summaries.tokens_used + p_tokens_input + p_tokens_output,
    tool_executions = usage_summaries.tool_executions + p_tool_executions,
    estimated_cost = usage_summaries.estimated_cost + p_cost,
    updated_at = now()
  RETURNING * INTO v_usage;

  RETURN v_usage;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_usage_history(
  p_user_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE(
  period_start date,
  messages_count integer,
  ai_requests_count integer,
  tokens_used integer,
  tool_executions integer,
  estimated_cost numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    us.period_start,
    us.messages_count,
    us.ai_requests_count,
    us.tokens_used,
    us.tool_executions,
    us.estimated_cost
  FROM public.usage_summaries us
  WHERE us.user_id = p_user_id
    AND us.period_type = 'daily'
    AND us.period_start >= CURRENT_DATE - p_days
  ORDER BY us.period_start DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_usage_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_today_usage public.usage_summaries;
  v_limits record;
  v_week_totals record;
  v_month_totals record;
  v_current_agents integer;
  v_current_swarms integer;
BEGIN
  v_today_usage := public.get_or_create_daily_usage(p_user_id);
  
  SELECT * INTO v_limits
  FROM public.get_user_plan_limits(p_user_id);

  SELECT 
    COALESCE(SUM(messages_count), 0) as messages,
    COALESCE(SUM(ai_requests_count), 0) as requests,
    COALESCE(SUM(tokens_used), 0) as tokens,
    COALESCE(SUM(tool_executions), 0) as tools,
    COALESCE(SUM(estimated_cost), 0) as cost
  INTO v_week_totals
  FROM public.usage_summaries
  WHERE user_id = p_user_id
    AND period_type = 'daily'
    AND period_start >= CURRENT_DATE - 7;

  SELECT 
    COALESCE(SUM(messages_count), 0) as messages,
    COALESCE(SUM(ai_requests_count), 0) as requests,
    COALESCE(SUM(tokens_used), 0) as tokens,
    COALESCE(SUM(tool_executions), 0) as tools,
    COALESCE(SUM(estimated_cost), 0) as cost
  INTO v_month_totals
  FROM public.usage_summaries
  WHERE user_id = p_user_id
    AND period_type = 'daily'
    AND period_start >= CURRENT_DATE - 30;

  SELECT COUNT(*) INTO v_current_agents
  FROM public.agents
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_current_swarms
  FROM public.swarms
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'today', jsonb_build_object(
      'messages', v_today_usage.messages_count,
      'requests', v_today_usage.ai_requests_count,
      'tokens', v_today_usage.tokens_used,
      'tokens_input', v_today_usage.tokens_input,
      'tokens_output', v_today_usage.tokens_output,
      'tool_executions', v_today_usage.tool_executions,
      'cost', v_today_usage.estimated_cost
    ),
    'week', jsonb_build_object(
      'messages', v_week_totals.messages,
      'requests', v_week_totals.requests,
      'tokens', v_week_totals.tokens,
      'tool_executions', v_week_totals.tools,
      'cost', v_week_totals.cost
    ),
    'month', jsonb_build_object(
      'messages', v_month_totals.messages,
      'requests', v_month_totals.requests,
      'tokens', v_month_totals.tokens,
      'tool_executions', v_month_totals.tools,
      'cost', v_month_totals.cost
    ),
    'limits', jsonb_build_object(
      'plan', COALESCE(v_limits.plan, 'free'),
      'messages_per_day', COALESCE(v_limits.messages_per_day, 100),
      'requests_per_day', COALESCE(v_limits.requests_per_day, 50),
      'tokens_per_day', COALESCE(v_limits.tokens_per_day, 50000),
      'max_agents', COALESCE(v_limits.max_agents, 3),
      'max_swarms', COALESCE(v_limits.max_swarms, 2)
    ),
    'current', jsonb_build_object(
      'agents', v_current_agents,
      'swarms', v_current_swarms
    ),
    'percentages', jsonb_build_object(
      'messages', CASE WHEN COALESCE(v_limits.messages_per_day, 100) > 0 
        THEN ROUND((v_today_usage.messages_count::numeric / v_limits.messages_per_day) * 100, 1)
        ELSE 0 END,
      'requests', CASE WHEN COALESCE(v_limits.requests_per_day, 50) > 0 
        THEN ROUND((v_today_usage.ai_requests_count::numeric / v_limits.requests_per_day) * 100, 1)
        ELSE 0 END,
      'tokens', CASE WHEN COALESCE(v_limits.tokens_per_day, 50000) > 0 
        THEN ROUND((v_today_usage.tokens_used::numeric / v_limits.tokens_per_day) * 100, 1)
        ELSE 0 END,
      'agents', CASE WHEN COALESCE(v_limits.max_agents, 3) > 0 
        THEN ROUND((v_current_agents::numeric / v_limits.max_agents) * 100, 1)
        ELSE 0 END,
      'swarms', CASE WHEN COALESCE(v_limits.max_swarms, 2) > 0 
        THEN ROUND((v_current_swarms::numeric / v_limits.max_swarms) * 100, 1)
        ELSE 0 END
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_increment_message_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT user_id INTO v_owner_id
  FROM public.swarms
  WHERE id = NEW.swarm_id;

  IF v_owner_id IS NOT NULL THEN
    PERFORM public.increment_usage(
      p_user_id := v_owner_id,
      p_messages := 1
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS message_usage_trigger ON public.messages;
CREATE TRIGGER message_usage_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_increment_message_usage();

CREATE OR REPLACE FUNCTION public.trigger_increment_ai_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.status = 'success' THEN
    PERFORM public.increment_usage(
      p_user_id := NEW.user_id,
      p_requests := 1,
      p_tokens_input := COALESCE(NEW.input_tokens, 0),
      p_tokens_output := COALESCE(NEW.output_tokens, 0),
      p_cost := COALESCE(NEW.total_cost, 0)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_usage_trigger ON public.ai_usage;
CREATE TRIGGER ai_usage_trigger
  AFTER INSERT ON public.ai_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_increment_ai_usage();

CREATE OR REPLACE FUNCTION public.trigger_increment_tool_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.increment_usage(
      p_user_id := NEW.user_id,
      p_tool_executions := 1
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tool_usage_increment_trigger ON public.tool_usage;
CREATE TRIGGER tool_usage_increment_trigger
  AFTER INSERT ON public.tool_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_increment_tool_usage();
