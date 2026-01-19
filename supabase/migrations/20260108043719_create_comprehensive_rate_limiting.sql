/*
  # Comprehensive Rate Limiting System

  1. Overview
    - Implements per-minute sliding window rate limiting for messages
    - Adds daily limits for agent and swarm creations
    - Different limits per plan tier (free, pro, enterprise)
    - Returns proper 429 responses with retry-after calculations

  2. New Tables
    - `rate_limit_events` - Sliding window event tracking
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User being rate limited
      - `event_type` (text) - Type of event (message, agent_create, swarm_create, request)
      - `window_key` (text) - Key for grouping (minute, hour, day)
      - `created_at` (timestamptz)

  3. Modified Tables
    - `plan_rate_limits` - Add messages_per_minute, agents_per_day, swarms_per_day

  4. New Functions
    - `record_rate_limit_event` - Records an event for rate limiting
    - `check_sliding_window_limit` - Check if within sliding window limit
    - `get_retry_after_seconds` - Calculate retry-after for 429 responses
    - `check_rate_limit_v2` - Enhanced rate limit check with all limits

  5. Security
    - RLS ensures users can only see their own rate limit events
    - Automatic cleanup of old events
*/

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  event_type text NOT NULL,
  resource_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limit events"
  ON public.rate_limit_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage rate limit events"
  ON public.rate_limit_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_user_type_time 
  ON public.rate_limit_events(user_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_cleanup 
  ON public.rate_limit_events(created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_rate_limits' AND column_name = 'messages_per_minute'
  ) THEN
    ALTER TABLE public.plan_rate_limits ADD COLUMN messages_per_minute integer DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_rate_limits' AND column_name = 'agents_per_day'
  ) THEN
    ALTER TABLE public.plan_rate_limits ADD COLUMN agents_per_day integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_rate_limits' AND column_name = 'swarms_per_day'
  ) THEN
    ALTER TABLE public.plan_rate_limits ADD COLUMN swarms_per_day integer DEFAULT 3;
  END IF;
END $$;

UPDATE public.plan_rate_limits
SET 
  messages_per_minute = 5,
  agents_per_day = 3,
  swarms_per_day = 2
WHERE plan = 'free';

UPDATE public.plan_rate_limits
SET 
  messages_per_minute = 30,
  agents_per_day = 10,
  swarms_per_day = 5
WHERE plan = 'pro';

UPDATE public.plan_rate_limits
SET 
  messages_per_minute = 100,
  agents_per_day = 50,
  swarms_per_day = 25
WHERE plan = 'enterprise';

CREATE OR REPLACE FUNCTION public.record_rate_limit_event(
  p_user_id uuid,
  p_event_type text,
  p_resource_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO public.rate_limit_events (user_id, event_type, resource_id, metadata)
  VALUES (p_user_id, p_event_type, p_resource_id, p_metadata)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_events_in_window(
  p_user_id uuid,
  p_event_type text,
  p_window_seconds integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;

  SELECT COUNT(*)::integer INTO v_count
  FROM public.rate_limit_events
  WHERE user_id = p_user_id
    AND event_type = p_event_type
    AND created_at >= v_window_start;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_oldest_event_in_window(
  p_user_id uuid,
  p_event_type text,
  p_window_seconds integer
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_oldest timestamptz;
  v_window_start timestamptz;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;

  SELECT MIN(created_at) INTO v_oldest
  FROM public.rate_limit_events
  WHERE user_id = p_user_id
    AND event_type = p_event_type
    AND created_at >= v_window_start;

  RETURN v_oldest;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_retry_after(
  p_user_id uuid,
  p_event_type text,
  p_window_seconds integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_oldest timestamptz;
  v_retry_after integer;
BEGIN
  v_oldest := public.get_oldest_event_in_window(p_user_id, p_event_type, p_window_seconds);

  IF v_oldest IS NULL THEN
    RETURN 0;
  END IF;

  v_retry_after := GREATEST(0, 
    EXTRACT(EPOCH FROM (v_oldest + (p_window_seconds || ' seconds')::interval - now()))::integer
  );

  RETURN v_retry_after + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit_v2(
  p_user_id uuid,
  p_event_type text DEFAULT 'request'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limits record;
  v_result jsonb;
  v_allowed boolean := true;
  v_reason text := null;
  v_retry_after integer := 0;
  v_minute_count integer;
  v_day_count integer;
  v_current_total integer;
  v_limit_value integer;
  v_window_seconds integer;
  v_daily_usage public.usage_summaries;
BEGIN
  SELECT 
    COALESCE(prl.plan, 'free') as plan,
    COALESCE(prl.messages_per_minute, 10) as messages_per_minute,
    COALESCE(prl.messages_per_day, 1000) as messages_per_day,
    COALESCE(prl.requests_per_minute, 10) as requests_per_minute,
    COALESCE(prl.requests_per_day, 100) as requests_per_day,
    COALESCE(prl.tokens_per_day, 100000) as tokens_per_day,
    COALESCE(prl.max_agents, 5) as max_agents,
    COALESCE(prl.max_swarms, 3) as max_swarms,
    COALESCE(prl.agents_per_day, 5) as agents_per_day,
    COALESCE(prl.swarms_per_day, 3) as swarms_per_day
  INTO v_limits
  FROM public.profiles p
  LEFT JOIN public.plan_rate_limits prl ON prl.plan = COALESCE(p.plan, 'free')
  WHERE p.id = p_user_id;

  IF v_limits IS NULL THEN
    SELECT 
      'free' as plan,
      5 as messages_per_minute,
      100 as messages_per_day,
      10 as requests_per_minute,
      50 as requests_per_day,
      50000 as tokens_per_day,
      3 as max_agents,
      2 as max_swarms,
      3 as agents_per_day,
      2 as swarms_per_day
    INTO v_limits;
  END IF;

  v_daily_usage := public.get_or_create_daily_usage(p_user_id);

  IF p_event_type = 'message' THEN
    v_minute_count := public.count_events_in_window(p_user_id, 'message', 60);
    
    IF v_minute_count >= v_limits.messages_per_minute THEN
      v_allowed := false;
      v_reason := 'Message rate limit exceeded (per minute)';
      v_retry_after := public.calculate_retry_after(p_user_id, 'message', 60);
    ELSIF v_daily_usage.messages_count >= v_limits.messages_per_day THEN
      v_allowed := false;
      v_reason := 'Daily message limit exceeded';
      v_retry_after := EXTRACT(EPOCH FROM (
        (CURRENT_DATE + interval '1 day') - now()
      ))::integer;
    END IF;

  ELSIF p_event_type = 'agent_create' THEN
    SELECT COUNT(*)::integer INTO v_current_total
    FROM public.agents WHERE user_id = p_user_id;

    IF v_current_total >= v_limits.max_agents THEN
      v_allowed := false;
      v_reason := 'Maximum agent limit reached for your plan';
      v_retry_after := 0;
    ELSE
      v_day_count := public.count_events_in_window(p_user_id, 'agent_create', 86400);
      
      IF v_day_count >= v_limits.agents_per_day THEN
        v_allowed := false;
        v_reason := 'Daily agent creation limit exceeded';
        v_retry_after := public.calculate_retry_after(p_user_id, 'agent_create', 86400);
      END IF;
    END IF;

  ELSIF p_event_type = 'swarm_create' THEN
    SELECT COUNT(*)::integer INTO v_current_total
    FROM public.swarms WHERE user_id = p_user_id;

    IF v_current_total >= v_limits.max_swarms THEN
      v_allowed := false;
      v_reason := 'Maximum swarm limit reached for your plan';
      v_retry_after := 0;
    ELSE
      v_day_count := public.count_events_in_window(p_user_id, 'swarm_create', 86400);
      
      IF v_day_count >= v_limits.swarms_per_day THEN
        v_allowed := false;
        v_reason := 'Daily swarm creation limit exceeded';
        v_retry_after := public.calculate_retry_after(p_user_id, 'swarm_create', 86400);
      END IF;
    END IF;

  ELSIF p_event_type = 'request' OR p_event_type = 'ai_request' THEN
    v_minute_count := public.count_events_in_window(p_user_id, 'request', 60);
    
    IF v_minute_count >= v_limits.requests_per_minute THEN
      v_allowed := false;
      v_reason := 'API rate limit exceeded (per minute)';
      v_retry_after := public.calculate_retry_after(p_user_id, 'request', 60);
    ELSIF v_daily_usage.ai_requests_count >= v_limits.requests_per_day THEN
      v_allowed := false;
      v_reason := 'Daily API request limit exceeded';
      v_retry_after := EXTRACT(EPOCH FROM (
        (CURRENT_DATE + interval '1 day') - now()
      ))::integer;
    END IF;

  ELSIF p_event_type = 'tokens' THEN
    IF v_daily_usage.tokens_used >= v_limits.tokens_per_day THEN
      v_allowed := false;
      v_reason := 'Daily token limit exceeded';
      v_retry_after := EXTRACT(EPOCH FROM (
        (CURRENT_DATE + interval '1 day') - now()
      ))::integer;
    END IF;
  END IF;

  v_result := jsonb_build_object(
    'allowed', v_allowed,
    'reason', v_reason,
    'retry_after', v_retry_after,
    'event_type', p_event_type,
    'usage', jsonb_build_object(
      'messages_per_minute', public.count_events_in_window(p_user_id, 'message', 60),
      'messages_today', v_daily_usage.messages_count,
      'requests_per_minute', public.count_events_in_window(p_user_id, 'request', 60),
      'requests_today', v_daily_usage.ai_requests_count,
      'tokens_today', v_daily_usage.tokens_used,
      'agents_created_today', public.count_events_in_window(p_user_id, 'agent_create', 86400),
      'swarms_created_today', public.count_events_in_window(p_user_id, 'swarm_create', 86400)
    ),
    'limits', jsonb_build_object(
      'plan', v_limits.plan,
      'messages_per_minute', v_limits.messages_per_minute,
      'messages_per_day', v_limits.messages_per_day,
      'requests_per_minute', v_limits.requests_per_minute,
      'requests_per_day', v_limits.requests_per_day,
      'tokens_per_day', v_limits.tokens_per_day,
      'max_agents', v_limits.max_agents,
      'max_swarms', v_limits.max_swarms,
      'agents_per_day', v_limits.agents_per_day,
      'swarms_per_day', v_limits.swarms_per_day
    )
  );

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_user_id uuid,
  p_event_type text,
  p_resource_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_check_result jsonb;
BEGIN
  v_check_result := public.check_rate_limit_v2(p_user_id, p_event_type);

  IF (v_check_result->>'allowed')::boolean THEN
    PERFORM public.record_rate_limit_event(p_user_id, p_event_type, p_resource_id);
  END IF;

  RETURN v_check_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limit_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.rate_limit_events
  WHERE created_at < now() - interval '2 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rate_limit_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result jsonb;
  v_limits record;
  v_daily_usage public.usage_summaries;
BEGIN
  SELECT 
    COALESCE(prl.plan, 'free') as plan,
    COALESCE(prl.messages_per_minute, 10) as messages_per_minute,
    COALESCE(prl.messages_per_day, 1000) as messages_per_day,
    COALESCE(prl.requests_per_minute, 10) as requests_per_minute,
    COALESCE(prl.requests_per_day, 100) as requests_per_day,
    COALESCE(prl.tokens_per_day, 100000) as tokens_per_day,
    COALESCE(prl.max_agents, 5) as max_agents,
    COALESCE(prl.max_swarms, 3) as max_swarms,
    COALESCE(prl.agents_per_day, 5) as agents_per_day,
    COALESCE(prl.swarms_per_day, 3) as swarms_per_day
  INTO v_limits
  FROM public.profiles p
  LEFT JOIN public.plan_rate_limits prl ON prl.plan = COALESCE(p.plan, 'free')
  WHERE p.id = p_user_id;

  IF v_limits IS NULL THEN
    SELECT 
      'free' as plan,
      5 as messages_per_minute,
      100 as messages_per_day,
      10 as requests_per_minute,
      50 as requests_per_day,
      50000 as tokens_per_day,
      3 as max_agents,
      2 as max_swarms,
      3 as agents_per_day,
      2 as swarms_per_day
    INTO v_limits;
  END IF;

  v_daily_usage := public.get_or_create_daily_usage(p_user_id);

  v_result := jsonb_build_object(
    'plan', v_limits.plan,
    'messages', jsonb_build_object(
      'per_minute', jsonb_build_object(
        'used', public.count_events_in_window(p_user_id, 'message', 60),
        'limit', v_limits.messages_per_minute,
        'remaining', GREATEST(0, v_limits.messages_per_minute - public.count_events_in_window(p_user_id, 'message', 60))
      ),
      'per_day', jsonb_build_object(
        'used', v_daily_usage.messages_count,
        'limit', v_limits.messages_per_day,
        'remaining', GREATEST(0, v_limits.messages_per_day - v_daily_usage.messages_count)
      )
    ),
    'requests', jsonb_build_object(
      'per_minute', jsonb_build_object(
        'used', public.count_events_in_window(p_user_id, 'request', 60),
        'limit', v_limits.requests_per_minute,
        'remaining', GREATEST(0, v_limits.requests_per_minute - public.count_events_in_window(p_user_id, 'request', 60))
      ),
      'per_day', jsonb_build_object(
        'used', v_daily_usage.ai_requests_count,
        'limit', v_limits.requests_per_day,
        'remaining', GREATEST(0, v_limits.requests_per_day - v_daily_usage.ai_requests_count)
      )
    ),
    'tokens', jsonb_build_object(
      'per_day', jsonb_build_object(
        'used', v_daily_usage.tokens_used,
        'limit', v_limits.tokens_per_day,
        'remaining', GREATEST(0, v_limits.tokens_per_day - v_daily_usage.tokens_used)
      )
    ),
    'agents', jsonb_build_object(
      'per_day', jsonb_build_object(
        'created', public.count_events_in_window(p_user_id, 'agent_create', 86400),
        'limit', v_limits.agents_per_day
      ),
      'total', jsonb_build_object(
        'count', (SELECT COUNT(*) FROM public.agents WHERE user_id = p_user_id),
        'limit', v_limits.max_agents
      )
    ),
    'swarms', jsonb_build_object(
      'per_day', jsonb_build_object(
        'created', public.count_events_in_window(p_user_id, 'swarm_create', 86400),
        'limit', v_limits.swarms_per_day
      ),
      'total', jsonb_build_object(
        'count', (SELECT COUNT(*) FROM public.swarms WHERE user_id = p_user_id),
        'limit', v_limits.max_swarms
      )
    ),
    'resets_at', jsonb_build_object(
      'minute', (now() + interval '1 minute')::timestamptz,
      'day', (CURRENT_DATE + interval '1 day')::timestamptz
    )
  );

  RETURN v_result;
END;
$$;
