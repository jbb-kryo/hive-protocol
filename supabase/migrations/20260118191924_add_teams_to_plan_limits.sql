/*
  # Add Teams Feature to Plan Limits

  1. Changes to `plan_rate_limits`
    - Add `teams_enabled` column (boolean)
    - Add `max_teams` column (integer)

  2. Plan Configuration
    - Basic (free): teams_enabled = false, max_teams = 0
    - Pro: teams_enabled = false, max_teams = 0
    - Unlimited: teams_enabled = true, max_teams = 999999 (unlimited)
    - Enterprise: teams_enabled = true, max_teams = 999999 (unlimited)

  3. Notes
    - Teams feature is only available on Unlimited and Enterprise plans
    - Basic and Pro plan users will see an upgrade prompt when trying to access teams
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_rate_limits' AND column_name = 'teams_enabled'
  ) THEN
    ALTER TABLE public.plan_rate_limits ADD COLUMN teams_enabled boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_rate_limits' AND column_name = 'max_teams'
  ) THEN
    ALTER TABLE public.plan_rate_limits ADD COLUMN max_teams integer DEFAULT 0;
  END IF;
END $$;

UPDATE public.plan_rate_limits
SET teams_enabled = false, max_teams = 0
WHERE plan = 'free';

UPDATE public.plan_rate_limits
SET teams_enabled = false, max_teams = 0
WHERE plan = 'pro';

UPDATE public.plan_rate_limits
SET teams_enabled = true, max_teams = 999999
WHERE plan = 'unlimited';

UPDATE public.plan_rate_limits
SET teams_enabled = true, max_teams = 999999
WHERE plan = 'enterprise';
