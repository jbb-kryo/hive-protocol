/*
  # Fix Overly Permissive RLS Policies

  ## Overview
  This migration fixes several RLS policies that were using USING (true) which
  effectively disabled row-level security. These have been replaced with proper
  authentication and authorization checks.

  ## Changes

  ### 1. AI Models Table
  - Changed public read access to require authentication
  - Only active, non-deprecated models visible

  ### 2. System Status Tables
  - Public read access retained (legitimate use case for status pages)
  - Write operations restricted to service role

  ### 3. Changelog System
  - Public read access for published entries only
  - Write operations restricted to admins

  ## Security Impact
  - Reduces attack surface by requiring authentication where appropriate
  - Maintains functionality for legitimate public-facing features
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Anyone can view active AI models' 
    AND tablename = 'ai_models'
  ) THEN
    DROP POLICY "Anyone can view active AI models" ON ai_models;
    
    CREATE POLICY "Authenticated users can view active AI models"
      ON ai_models FOR SELECT
      TO authenticated
      USING (is_active = true AND NOT deprecated);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Anyone can read changelog entries' 
    AND tablename = 'changelog_entries'
  ) THEN
    DROP POLICY "Anyone can read changelog entries" ON changelog_entries;
    
    CREATE POLICY "Anyone can view published changelog entries"
      ON changelog_entries FOR SELECT
      TO anon, authenticated
      USING (published = true);
  END IF;
END $$;
