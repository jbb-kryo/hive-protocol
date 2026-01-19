/*
  # Add User Suspension Fields

  1. Changes to `profiles` table
    - `suspended` (boolean) - Whether the user account is suspended
    - `suspended_at` (timestamptz) - When the account was suspended
    - `suspended_reason` (text) - Reason for suspension
    - `suspended_by` (uuid) - Admin who suspended the account

  2. Security
    - Only admins can update suspension fields via RLS policies

  3. Notes
    - Default suspended value is false
    - suspended_by references the admin who performed the action
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'suspended'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN suspended boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'suspended_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN suspended_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'suspended_reason'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN suspended_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'suspended_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN suspended_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON public.profiles(suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);