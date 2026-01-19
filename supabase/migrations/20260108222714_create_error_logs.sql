/*
  # Create Error Logs System

  1. New Tables
    - `error_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, references auth.users)
      - `error_message` (text)
      - `error_stack` (text, nullable)
      - `error_name` (text)
      - `url` (text, nullable)
      - `user_agent` (text, nullable)
      - `context` (jsonb, nullable)
      - `created_at` (timestamptz)
      - `resolved` (boolean, default false)
      - `resolved_at` (timestamptz, nullable)
      - `resolved_by` (uuid, nullable, references auth.users)
      - `notes` (text, nullable)

  2. Security
    - Enable RLS on `error_logs` table
    - Add policy for authenticated users to insert their own error logs
    - Add policy for users to view their own error logs

  3. Indexes
    - Index on user_id for faster queries
    - Index on created_at for time-based queries
    - Index on resolved for filtering
*/

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message text NOT NULL,
  error_stack text,
  error_name text NOT NULL,
  url text,
  user_agent text,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own error logs"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
