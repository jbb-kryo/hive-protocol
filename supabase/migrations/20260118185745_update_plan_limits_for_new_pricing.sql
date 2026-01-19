/*
  # Update Plan Limits for New Pricing Structure

  1. Changes to `plan_rate_limits`
    - Update limits for 'free' plan (now called Basic)
      - 3 agents, 2 swarms, 1,000 messages/month (33 messages/day)
    - Update limits for 'pro' plan
      - 10 agents, 10 swarms, 50,000 messages/month (1,667 messages/day)
    - Add new 'unlimited' plan
      - Unlimited agents, swarms, and messages (set to very high limits)
    - Update 'enterprise' plan
      - Same as unlimited with very high limits

  2. Plan Details
    - Basic: $0/month
    - Pro: $29/month
    - Unlimited: $99/month
    - Enterprise: Contact Sales (custom pricing)

  3. Notes
    - Messages per day calculated as monthly limit / 30
    - Unlimited plans use 999999 as a practical "unlimited" value
    - Rate limits remain reasonable to prevent abuse
*/

-- Update free (Basic) plan limits
UPDATE public.plan_rate_limits 
SET 
  max_agents = 3,
  max_swarms = 2,
  messages_per_day = 33,
  requests_per_minute = 5,
  requests_per_day = 50,
  tokens_per_day = 50000,
  updated_at = now()
WHERE plan = 'free';

-- Update pro plan limits
UPDATE public.plan_rate_limits 
SET 
  max_agents = 10,
  max_swarms = 10,
  messages_per_day = 1667,
  requests_per_minute = 20,
  requests_per_day = 1000,
  tokens_per_day = 500000,
  updated_at = now()
WHERE plan = 'pro';

-- Update enterprise plan limits (unlimited)
UPDATE public.plan_rate_limits 
SET 
  max_agents = 999999,
  max_swarms = 999999,
  messages_per_day = 999999,
  requests_per_minute = 100,
  requests_per_day = 999999,
  tokens_per_day = 999999999,
  updated_at = now()
WHERE plan = 'enterprise';

-- Add unlimited plan if it doesn't exist
DO $$
BEGIN
  -- Check if unlimited plan exists for each model
  IF NOT EXISTS (
    SELECT 1 FROM public.plan_rate_limits WHERE plan = 'unlimited'
  ) THEN
    -- Insert unlimited plan for each model that has other plans
    INSERT INTO public.plan_rate_limits (
      plan,
      model_id,
      max_agents,
      max_swarms,
      messages_per_day,
      requests_per_minute,
      requests_per_day,
      tokens_per_day
    )
    SELECT DISTINCT
      'unlimited' as plan,
      model_id,
      999999 as max_agents,
      999999 as max_swarms,
      999999 as messages_per_day,
      100 as requests_per_minute,
      999999 as requests_per_day,
      999999999 as tokens_per_day
    FROM public.plan_rate_limits
    WHERE model_id IS NOT NULL
    ON CONFLICT (plan, model_id) DO NOTHING;

    -- Also add unlimited plan with NULL model_id as a fallback
    INSERT INTO public.plan_rate_limits (
      plan,
      model_id,
      max_agents,
      max_swarms,
      messages_per_day,
      requests_per_minute,
      requests_per_day,
      tokens_per_day
    )
    VALUES (
      'unlimited',
      NULL,
      999999,
      999999,
      999999,
      100,
      999999,
      999999999
    )
    ON CONFLICT (plan, model_id) DO NOTHING;
  END IF;
END $$;
