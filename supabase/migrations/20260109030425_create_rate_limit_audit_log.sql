/*
  # Rate Limit Audit Log

  1. New Tables
    - `rate_limit_audit_log` - Tracks all changes to rate limit configurations
      - `id` (uuid, primary key)
      - `admin_id` (uuid) - Admin who made the change
      - `action` (text) - Type of action (create, update, delete)
      - `plan` (text) - Plan affected
      - `changes` (jsonb) - What was changed (old vs new values)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled
    - Only admins can view and create audit logs
*/

CREATE TABLE IF NOT EXISTS public.rate_limit_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  plan text NOT NULL,
  rate_limit_id uuid,
  previous_values jsonb DEFAULT '{}',
  new_values jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rate_limit_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rate limit audit logs"
  ON public.rate_limit_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create rate limit audit logs"
  ON public.rate_limit_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_rate_limit_audit_log_created_at 
  ON public.rate_limit_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_audit_log_plan 
  ON public.rate_limit_audit_log(plan);

CREATE INDEX IF NOT EXISTS idx_rate_limit_audit_log_admin 
  ON public.rate_limit_audit_log(admin_id);

DROP POLICY IF EXISTS "Admins can manage rate limits" ON public.plan_rate_limits;
CREATE POLICY "Admins can manage rate limits"
  ON public.plan_rate_limits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Anyone can read rate limits" ON public.plan_rate_limits;
CREATE POLICY "Anyone can read rate limits"
  ON public.plan_rate_limits
  FOR SELECT
  TO authenticated
  USING (true);