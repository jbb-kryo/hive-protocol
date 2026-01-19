/*
  # Create Job Applications System

  1. New Tables
    - `job_applications`
      - `id` (uuid, primary key)
      - `full_name` (text) - Applicant's full name
      - `email` (text) - Applicant's email address
      - `phone` (text, optional) - Applicant's phone number
      - `linkedin_url` (text, optional) - LinkedIn profile URL
      - `portfolio_url` (text, optional) - Portfolio or personal website
      - `resume_url` (text, optional) - Link to resume
      - `cover_letter` (text, optional) - Cover letter or message
      - `position_interest` (text) - Position or area of interest
      - `experience_years` (integer) - Years of relevant experience
      - `status` (text) - Application status (pending, reviewed, contacted, rejected)
      - `created_at` (timestamptz) - When application was submitted
      - `updated_at` (timestamptz) - When application was last updated
      - `notes` (text, optional) - Internal notes for recruiters

  2. Security
    - Enable RLS on `job_applications` table
    - Public can insert new applications (no auth required for applying)
    - Only authenticated admins can view/update applications
*/

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  linkedin_url text,
  portfolio_url text,
  resume_url text,
  cover_letter text,
  position_interest text NOT NULL,
  experience_years integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewed', 'contacted', 'rejected', 'hired'))
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit job applications"
  ON job_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can view job applications"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update job applications"
  ON job_applications
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

CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_created_at ON job_applications(created_at DESC);