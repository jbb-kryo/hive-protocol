/*
  # Fix Marketplace Reviews RLS Policy

  ## Overview
  This migration restricts marketplace reviews to only show reviews for published 
  agents, preventing information disclosure about unpublished or rejected agents.

  ## Changes

  ### Marketplace Reviews
  - Changed from fully public USING(true) to checking agent publication status
  - Reviews for unpublished agents are now hidden from public view

  ## Policies Documented as Intentionally Public

  The following policies use USING(true) intentionally:

  ### Status Page Tables
  - system_services, system_incidents, incident_updates
  - Reason: Status pages must be accessible to unauthenticated users
  - Write operations are restricted to service_role

  ### Changelog Tables  
  - changelog_versions, changelog_entries
  - Reason: Public changelog for release notes
  - No sensitive data; versions are meant to be public

  ### Marketplace Categories
  - marketplace_categories
  - Reason: Categories needed for public marketplace browsing
  - Write operations restricted to admins

  ### Marketplace Featured Slots
  - marketplace_featured_slots
  - Reason: Featured agents shown on public marketplace homepage
  - Write operations restricted to admins

  ### Plan Rate Limits (authenticated only)
  - plan_rate_limits
  - Reason: Users need to see rate limits for their plan
  - Already requires authentication; no user-specific data

  ## Security Impact
  - Reviews no longer expose information about unpublished agents
  - All other public policies are documented with justifications
*/

-- Fix marketplace_reviews to only show reviews for published agents
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Anyone can view reviews' 
    AND tablename = 'marketplace_reviews'
  ) THEN
    DROP POLICY "Anyone can view reviews" ON marketplace_reviews;
    
    CREATE POLICY "Public can view reviews for published agents"
      ON marketplace_reviews FOR SELECT
      TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1 FROM marketplace_agents ma 
          WHERE ma.id = marketplace_reviews.agent_id 
          AND ma.is_published = true
        )
      );
  END IF;
END $$;

-- Add documentation comments explaining intentionally public tables
COMMENT ON TABLE changelog_versions IS 
  'Public read access is INTENTIONAL for public release notes. Write restricted to admins via service_role.';

COMMENT ON TABLE changelog_entries IS 
  'Public read access is INTENTIONAL for public release notes. Write restricted to admins via service_role.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_services' AND schemaname = 'public') THEN
    COMMENT ON TABLE system_services IS 
      'Public read access is INTENTIONAL for status page. Write restricted to service_role.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_incidents' AND schemaname = 'public') THEN
    COMMENT ON TABLE system_incidents IS 
      'Public read access is INTENTIONAL for status page. Write restricted to service_role.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'incident_updates' AND schemaname = 'public') THEN
    COMMENT ON TABLE incident_updates IS 
      'Public read access is INTENTIONAL for status page. Write restricted to service_role.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketplace_categories' AND schemaname = 'public') THEN
    COMMENT ON TABLE marketplace_categories IS 
      'Public read access is INTENTIONAL for marketplace browsing. Write restricted to admins.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketplace_featured_slots' AND schemaname = 'public') THEN
    COMMENT ON TABLE marketplace_featured_slots IS 
      'Public read access is INTENTIONAL for marketplace homepage. Write restricted to admins.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'plan_rate_limits' AND schemaname = 'public') THEN
    COMMENT ON TABLE plan_rate_limits IS 
      'Authenticated read access is INTENTIONAL - users need to see their plan rate limits.';
  END IF;
END $$;
