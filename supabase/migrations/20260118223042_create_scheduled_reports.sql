/*
  # Scheduled Analytics Reports

  1. New Tables
    - `scheduled_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Report name
      - `description` (text) - Report description
      - `report_type` (text) - 'usage', 'performance', 'cost', 'comprehensive'
      - `frequency` (text) - 'daily', 'weekly', 'monthly'
      - `schedule_day` (integer) - Day of week (1-7) for weekly, day of month (1-31) for monthly
      - `schedule_time` (time) - Time to send report
      - `email_recipients` (text[]) - Array of email addresses
      - `include_charts` (boolean) - Include visual charts in email
      - `date_range_days` (integer) - Number of days to include in report
      - `filters` (jsonb) - Optional filters (agents, swarms, etc.)
      - `last_sent_at` (timestamptz) - When report was last sent
      - `next_scheduled_at` (timestamptz) - When report is next scheduled
      - `is_active` (boolean) - Whether report is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `report_history`
      - `id` (uuid, primary key)
      - `scheduled_report_id` (uuid, references scheduled_reports)
      - `user_id` (uuid, references auth.users)
      - `sent_at` (timestamptz)
      - `status` (text) - 'success', 'failed', 'partial'
      - `error_message` (text)
      - `recipients_count` (integer)
      - `report_data` (jsonb) - Snapshot of report data
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can manage their own scheduled reports
    - Users can view their own report history
*/

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  report_type text NOT NULL DEFAULT 'comprehensive' CHECK (report_type IN ('usage', 'performance', 'cost', 'comprehensive')),
  frequency text NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day integer CHECK (schedule_day >= 1 AND schedule_day <= 31),
  schedule_time time DEFAULT '09:00:00',
  email_recipients text[] DEFAULT '{}',
  include_charts boolean DEFAULT true,
  date_range_days integer DEFAULT 30,
  filters jsonb DEFAULT '{}',
  last_sent_at timestamptz,
  next_scheduled_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id uuid REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message text,
  recipients_count integer DEFAULT 0,
  report_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled reports"
  ON scheduled_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scheduled reports"
  ON scheduled_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled reports"
  ON scheduled_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled reports"
  ON scheduled_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own report history"
  ON report_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert report history"
  ON report_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user ON scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next ON scheduled_reports(next_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_report_history_report ON report_history(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_report_history_user ON report_history(user_id);
CREATE INDEX IF NOT EXISTS idx_report_history_sent ON report_history(sent_at DESC);

CREATE OR REPLACE FUNCTION update_scheduled_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scheduled_reports_updated_at ON scheduled_reports;
CREATE TRIGGER scheduled_reports_updated_at
  BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_reports_updated_at();

CREATE OR REPLACE FUNCTION calculate_next_scheduled_at(
  p_frequency text,
  p_schedule_day integer,
  p_schedule_time time
)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_date date;
  v_now timestamptz := now();
  v_today date := current_date;
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      IF v_now::time < p_schedule_time THEN
        v_next_date := v_today;
      ELSE
        v_next_date := v_today + interval '1 day';
      END IF;
    WHEN 'weekly' THEN
      v_next_date := v_today + ((p_schedule_day - extract(dow from v_today)::integer + 7) % 7)::integer;
      IF v_next_date = v_today AND v_now::time >= p_schedule_time THEN
        v_next_date := v_next_date + interval '7 days';
      END IF;
    WHEN 'monthly' THEN
      IF extract(day from v_today) < p_schedule_day OR 
         (extract(day from v_today) = p_schedule_day AND v_now::time < p_schedule_time) THEN
        v_next_date := date_trunc('month', v_today) + (p_schedule_day - 1) * interval '1 day';
      ELSE
        v_next_date := date_trunc('month', v_today) + interval '1 month' + (p_schedule_day - 1) * interval '1 day';
      END IF;
      IF extract(day from v_next_date) != p_schedule_day THEN
        v_next_date := date_trunc('month', v_next_date + interval '1 month') - interval '1 day';
      END IF;
    ELSE
      v_next_date := v_today + interval '1 day';
  END CASE;
  
  RETURN v_next_date + p_schedule_time;
END;
$$;
