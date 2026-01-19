/*
  # Add Workflows Feature to Plan Limits

  1. Changes to `plan_rate_limits`
    - Add `workflows_enabled` column (boolean)
    - Add `max_workflows` column (integer)

  2. Plan Configuration
    - Basic (free): workflows_enabled = false, max_workflows = 0
    - Pro: workflows_enabled = true, max_workflows = 10
    - Unlimited: workflows_enabled = true, max_workflows = 999999 (unlimited)
    - Enterprise: workflows_enabled = true, max_workflows = 999999 (unlimited)

  3. Notes
    - Workflows feature is only available on Pro, Unlimited, and Enterprise plans
    - Basic plan users will see an upgrade prompt when trying to access workflows
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_rate_limits' AND column_name = 'workflows_enabled'
  ) THEN
    ALTER TABLE public.plan_rate_limits ADD COLUMN workflows_enabled boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_rate_limits' AND column_name = 'max_workflows'
  ) THEN
    ALTER TABLE public.plan_rate_limits ADD COLUMN max_workflows integer DEFAULT 0;
  END IF;
END $$;

UPDATE public.plan_rate_limits
SET workflows_enabled = false, max_workflows = 0
WHERE plan = 'free';

UPDATE public.plan_rate_limits
SET workflows_enabled = true, max_workflows = 10
WHERE plan = 'pro';

UPDATE public.plan_rate_limits
SET workflows_enabled = true, max_workflows = 999999
WHERE plan = 'unlimited';

UPDATE public.plan_rate_limits
SET workflows_enabled = true, max_workflows = 999999
WHERE plan = 'enterprise';
