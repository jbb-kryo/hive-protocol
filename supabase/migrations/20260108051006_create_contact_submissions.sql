/*
  # Create Contact Submissions System

  1. New Tables
    - `contact_submissions`
      - `id` (uuid, primary key)
      - `name` (text, required) - submitter's name
      - `email` (text, required) - submitter's email
      - `category` (text, required) - type of inquiry (sales, support, partnership, general)
      - `subject` (text, optional) - message subject
      - `message` (text, required) - the message content
      - `status` (text) - submission status (new, in_progress, resolved, closed)
      - `priority` (text) - priority level (low, medium, high)
      - `assigned_to` (uuid, optional) - admin user assigned to handle
      - `notes` (text, optional) - internal notes
      - `resolved_at` (timestamptz, optional) - when resolved
      - `created_at` (timestamptz) - submission timestamp
      - `updated_at` (timestamptz) - last update timestamp

  2. Security
    - Enable RLS on `contact_submissions` table
    - Public users can insert submissions (no auth required for contact form)
    - Only authenticated admins can read/update submissions

  3. Indexes
    - Index on status for filtering
    - Index on category for filtering
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('sales', 'support', 'partnership', 'billing', 'feedback', 'general')),
  CONSTRAINT valid_status CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high'))
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update submissions"
  ON contact_submissions
  FOR UPDATE
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

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_category ON contact_submissions(category);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

CREATE OR REPLACE FUNCTION update_contact_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contact_submission_updated_at ON contact_submissions;
CREATE TRIGGER trigger_update_contact_submission_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submission_updated_at();