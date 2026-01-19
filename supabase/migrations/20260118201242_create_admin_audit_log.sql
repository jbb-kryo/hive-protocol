/*
  # Create Admin Audit Log System

  1. New Tables
    - `admin_audit_log`
      - `id` (uuid, primary key)
      - `admin_user_id` (uuid, references auth.users)
      - `action` (text) - The action performed (e.g., 'user.suspend', 'user.delete', 'config.update')
      - `target_type` (text) - Type of target (e.g., 'user', 'agent', 'swarm', 'config')
      - `target_id` (text) - ID of the target entity
      - `details` (jsonb) - Additional details about the action
      - `ip_address` (inet) - IP address of the admin
      - `user_agent` (text) - Browser/client user agent
      - `created_at` (timestamptz)

    - `admin_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique)
      - `setting_value` (jsonb)
      - `updated_by` (uuid)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Only admins can read audit logs
    - Only system can insert audit logs (via service role)

  3. Indexes
    - Index on admin_user_id for filtering by admin
    - Index on action for filtering by action type
    - Index on created_at for date range queries
    - Index on target_type and target_id for entity lookups
*/

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb DEFAULT '{}',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_audit_log' AND policyname = 'Admins can view audit logs'
  ) THEN
    CREATE POLICY "Admins can view audit logs"
      ON public.admin_audit_log
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_settings' AND policyname = 'Admins can view settings'
  ) THEN
    CREATE POLICY "Admins can view settings"
      ON public.admin_settings
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_settings' AND policyname = 'Admins can update settings'
  ) THEN
    CREATE POLICY "Admins can update settings"
      ON public.admin_settings
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_settings' AND policyname = 'Admins can insert settings'
  ) THEN
    CREATE POLICY "Admins can insert settings"
      ON public.admin_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES 
  ('admin_session_timeout_minutes', '30'::jsonb),
  ('admin_require_2fa', 'true'::jsonb),
  ('admin_ip_allowlist_enabled', 'false'::jsonb),
  ('admin_ip_allowlist', '[]'::jsonb),
  ('admin_rate_limit_per_minute', '60'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
