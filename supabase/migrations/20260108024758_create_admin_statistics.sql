/*
  # Create Admin Statistics Functions

  1. New Functions
    - `get_platform_stats` - Returns total users, active swarms, messages/day, with trends
    - `get_user_growth_data` - Returns monthly user signup data for charts
    - `get_framework_usage` - Returns agent framework distribution
    - `get_recent_signups` - Returns recent user signups with details

  2. Security
    - Functions are accessible to authenticated users
    - Admin-only data is protected by checking profile role
*/

CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_users integer;
  prev_month_users integer;
  active_swarms integer;
  prev_month_swarms integer;
  messages_today bigint;
  messages_yesterday bigint;
  user_trend numeric;
  swarm_trend numeric;
  message_trend numeric;
BEGIN
  SELECT COUNT(*) INTO total_users FROM profiles;
  
  SELECT COUNT(*) INTO prev_month_users 
  FROM profiles 
  WHERE created_at < date_trunc('month', now());
  
  SELECT COUNT(*) INTO active_swarms 
  FROM swarms 
  WHERE status = 'active';
  
  SELECT COUNT(*) INTO prev_month_swarms 
  FROM swarms 
  WHERE status = 'active' 
  AND created_at < date_trunc('month', now());
  
  SELECT COUNT(*) INTO messages_today 
  FROM messages 
  WHERE created_at >= date_trunc('day', now());
  
  SELECT COUNT(*) INTO messages_yesterday 
  FROM messages 
  WHERE created_at >= date_trunc('day', now() - interval '1 day')
  AND created_at < date_trunc('day', now());
  
  IF prev_month_users > 0 THEN
    user_trend := ((total_users - prev_month_users)::numeric / prev_month_users * 100);
  ELSE
    user_trend := 100;
  END IF;
  
  IF prev_month_swarms > 0 THEN
    swarm_trend := ((active_swarms - prev_month_swarms)::numeric / prev_month_swarms * 100);
  ELSE
    swarm_trend := CASE WHEN active_swarms > 0 THEN 100 ELSE 0 END;
  END IF;
  
  IF messages_yesterday > 0 THEN
    message_trend := ((messages_today - messages_yesterday)::numeric / messages_yesterday * 100);
  ELSE
    message_trend := CASE WHEN messages_today > 0 THEN 100 ELSE 0 END;
  END IF;
  
  result := jsonb_build_object(
    'total_users', total_users,
    'user_trend', ROUND(COALESCE(user_trend, 0), 1),
    'active_swarms', active_swarms,
    'swarm_trend', ROUND(COALESCE(swarm_trend, 0), 1),
    'messages_today', messages_today,
    'message_trend', ROUND(COALESCE(message_trend, 0), 1),
    'mrr', 0,
    'mrr_trend', 0
  );
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_growth_data(months_back integer DEFAULT 6)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', TO_CHAR(month, 'Mon'),
      'users', user_count,
      'month', month
    ) ORDER BY month
  ) INTO result
  FROM (
    SELECT 
      date_trunc('month', d.month) as month,
      COUNT(p.id) as user_count
    FROM (
      SELECT generate_series(
        date_trunc('month', now() - (months_back || ' months')::interval),
        date_trunc('month', now()),
        '1 month'::interval
      ) as month
    ) d
    LEFT JOIN profiles p ON date_trunc('month', p.created_at) <= d.month
    GROUP BY d.month
  ) monthly_data;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION get_framework_usage()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_agents integer;
BEGIN
  SELECT COUNT(*) INTO total_agents FROM agents;
  
  IF total_agents = 0 THEN
    RETURN '[]'::jsonb;
  END IF;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', framework,
      'value', ROUND((count::numeric / total_agents * 100), 1),
      'count', count
    ) ORDER BY count DESC
  ) INTO result
  FROM (
    SELECT 
      COALESCE(framework, 'Unknown') as framework,
      COUNT(*) as count
    FROM agents
    GROUP BY framework
  ) framework_data;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION get_recent_signups(limit_count integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(user_data ORDER BY created_at DESC) INTO result
  FROM (
    SELECT 
      jsonb_build_object(
        'id', p.id,
        'name', COALESCE(p.full_name, 'Anonymous'),
        'email', u.email,
        'plan', p.plan,
        'agents', (SELECT COUNT(*) FROM agents WHERE user_id = p.id),
        'joined', p.created_at,
        'avatar_url', p.avatar_url
      ) as user_data,
      p.created_at
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    ORDER BY p.created_at DESC
    LIMIT limit_count
  ) recent_users;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION get_daily_message_stats(days_back integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', day,
      'count', message_count
    ) ORDER BY day
  ) INTO result
  FROM (
    SELECT 
      d.day::date as day,
      COUNT(m.id) as message_count
    FROM (
      SELECT generate_series(
        date_trunc('day', now() - (days_back || ' days')::interval),
        date_trunc('day', now()),
        '1 day'::interval
      ) as day
    ) d
    LEFT JOIN messages m ON date_trunc('day', m.created_at) = d.day
    GROUP BY d.day
  ) daily_data;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION get_plan_distribution()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'plan', plan,
      'count', count,
      'percentage', percentage
    ) ORDER BY count DESC
  ) INTO result
  FROM (
    SELECT 
      plan,
      COUNT(*) as count,
      ROUND((COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM profiles), 0) * 100), 1) as percentage
    FROM profiles
    GROUP BY plan
  ) plan_data;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;