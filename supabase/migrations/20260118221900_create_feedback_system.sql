/*
  # Create User Feedback System

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable for anonymous)
      - `type` (text) - bug, feature, question, other
      - `subject` (text) - brief subject line
      - `message` (text) - detailed feedback message
      - `screenshot_url` (text, nullable) - optional screenshot
      - `status` (text) - new, in_progress, resolved, closed
      - `priority` (text) - low, medium, high, critical
      - `admin_notes` (text, nullable) - internal notes
      - `resolved_at` (timestamptz, nullable)
      - `resolved_by` (uuid, nullable)
      - `page_url` (text) - page where feedback was submitted
      - `user_agent` (text) - browser info
      - `metadata` (jsonb) - additional context
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `nps_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `score` (integer) - 0-10 NPS score
      - `comment` (text, nullable)
      - `trigger` (text) - what triggered the survey
      - `created_at` (timestamptz)

    - `feedback_attachments`
      - `id` (uuid, primary key)
      - `feedback_id` (uuid, references feedback)
      - `file_url` (text)
      - `file_name` (text)
      - `file_type` (text)
      - `file_size` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can create and view their own feedback
    - Admins can view and manage all feedback
*/

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('bug', 'feature', 'question', 'other')),
  subject text NOT NULL,
  message text NOT NULL,
  screenshot_url text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  admin_notes text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0 AND score <= 10),
  comment text,
  trigger text NOT NULL DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update feedback"
  ON feedback FOR UPDATE
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

CREATE POLICY "Users can create NPS responses"
  ON nps_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own NPS responses"
  ON nps_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all NPS responses"
  ON nps_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create attachments for their feedback"
  ON feedback_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM feedback
      WHERE feedback.id = feedback_id
      AND feedback.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view attachments for their feedback"
  ON feedback_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM feedback
      WHERE feedback.id = feedback_id
      AND feedback.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attachments"
  ON feedback_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nps_responses_user_id ON nps_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_responses_score ON nps_responses(score);
CREATE INDEX IF NOT EXISTS idx_feedback_attachments_feedback_id ON feedback_attachments(feedback_id);

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedback_updated_at ON feedback;
CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();
