/*
  # Add Marketplace Feature to Plan Limits

  1. Changes to `plan_rate_limits`
    - Add `marketplace_enabled` column (boolean)

  2. Plan Configuration
    - Basic (free): marketplace_enabled = false
    - Pro: marketplace_enabled = true
    - Unlimited: marketplace_enabled = true
    - Enterprise: marketplace_enabled = true

  3. Notes
    - Marketplace feature is available on Pro, Unlimited, and Enterprise plans
    - Basic plan users will see an upgrade prompt when trying to access Marketplace
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plan_rate_limits' AND column_name = 'marketplace_enabled'
  ) THEN
    ALTER TABLE public.plan_rate_limits ADD COLUMN marketplace_enabled boolean DEFAULT false;
  END IF;
END $$;

UPDATE public.plan_rate_limits
SET marketplace_enabled = false
WHERE plan = 'free';

UPDATE public.plan_rate_limits
SET marketplace_enabled = true
WHERE plan = 'pro';

UPDATE public.plan_rate_limits
SET marketplace_enabled = true
WHERE plan = 'unlimited';

UPDATE public.plan_rate_limits
SET marketplace_enabled = true
WHERE plan = 'enterprise';
