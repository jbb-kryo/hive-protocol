/*
  # Add Onboarding Tracking

  1. New Columns
    - `onboarding_completed_at` (timestamptz) - When user completed onboarding
    - `onboarding_current_step` (integer) - Current step user is on (1-5)
    - `onboarding_progress` (jsonb) - Stores partial onboarding data

  2. Changes
    - Migrate existing `onboarding_complete` boolean to `onboarding_completed_at` timestamp
    - Keep `onboarding_complete` for backward compatibility (computed from timestamp)

  3. Notes
    - Users with `onboarding_complete = true` will get `onboarding_completed_at` set to their profile creation time
    - Progress is tracked per-step to enable restart functionality
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_current_step'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_current_step integer DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_progress'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_progress jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

UPDATE profiles
SET onboarding_completed_at = COALESCE(created_at, now())
WHERE onboarding_complete = true AND onboarding_completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed_at
ON profiles(onboarding_completed_at);

COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when user completed or skipped onboarding';
COMMENT ON COLUMN profiles.onboarding_current_step IS 'Current onboarding step (1-5), used for progress tracking';
COMMENT ON COLUMN profiles.onboarding_progress IS 'JSON storing partial onboarding data (useCase, framework, agentName, etc.)';
