/*
  # Create Changelog System

  1. New Tables
    - `changelog_versions`
      - `id` (uuid, primary key)
      - `version` (text) - Version number (e.g., "1.2.0")
      - `title` (text) - Version title
      - `description` (text) - Version summary
      - `released_at` (date) - Release date
      - `is_major` (boolean) - Major release flag
      - `created_at` (timestamptz)

    - `changelog_entries`
      - `id` (uuid, primary key)
      - `version_id` (uuid, foreign key)
      - `category` (text) - new_feature, improvement, bug_fix, breaking_change
      - `title` (text) - Entry title
      - `description` (text) - Entry description
      - `order_index` (int) - Display order within version
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for changelog
*/

-- Create changelog_versions table
CREATE TABLE IF NOT EXISTS changelog_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  released_at date NOT NULL DEFAULT CURRENT_DATE,
  is_major boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE changelog_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view changelog versions"
  ON changelog_versions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create changelog_entries table
CREATE TABLE IF NOT EXISTS changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES changelog_versions(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('new_feature', 'improvement', 'bug_fix', 'breaking_change')),
  title text NOT NULL,
  description text,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view changelog entries"
  ON changelog_entries
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_changelog_versions_released_at ON changelog_versions(released_at DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_entries_version_id ON changelog_entries(version_id);
CREATE INDEX IF NOT EXISTS idx_changelog_entries_category ON changelog_entries(category);

-- Insert sample changelog data
INSERT INTO changelog_versions (version, title, description, released_at, is_major) VALUES
  ('1.0.0', 'Initial Release', 'The first public release of HIVE Protocol, featuring core swarm intelligence capabilities.', '2026-01-01', true),
  ('1.1.0', 'Enhanced Agent Management', 'Improved agent configuration and monitoring capabilities.', '2026-01-05', false),
  ('1.2.0', 'Tool Integration Update', 'Major improvements to tool integration and custom tool creation.', '2026-01-08', false),
  ('2.0.0', 'Next Generation Platform', 'Complete platform redesign with enhanced performance and new features.', '2026-01-09', true);

-- Get version IDs for entries
DO $$
DECLARE
  v1_id uuid;
  v1_1_id uuid;
  v1_2_id uuid;
  v2_id uuid;
BEGIN
  SELECT id INTO v1_id FROM changelog_versions WHERE version = '1.0.0';
  SELECT id INTO v1_1_id FROM changelog_versions WHERE version = '1.1.0';
  SELECT id INTO v1_2_id FROM changelog_versions WHERE version = '1.2.0';
  SELECT id INTO v2_id FROM changelog_versions WHERE version = '2.0.0';

  -- Version 1.0.0 entries
  INSERT INTO changelog_entries (version_id, category, title, description, order_index) VALUES
    (v1_id, 'new_feature', 'Swarm Creation', 'Create and manage AI agent swarms with intuitive interface', 1),
    (v1_id, 'new_feature', 'Real-time Messaging', 'WebSocket-powered real-time communication between agents', 2),
    (v1_id, 'new_feature', 'Agent Templates', 'Pre-built agent templates for common use cases', 3),
    (v1_id, 'new_feature', 'Dashboard Analytics', 'Comprehensive dashboard with usage statistics', 4);

  -- Version 1.1.0 entries
  INSERT INTO changelog_entries (version_id, category, title, description, order_index) VALUES
    (v1_1_id, 'new_feature', 'Agent Status Tracking', 'Monitor agent health and activity in real-time', 1),
    (v1_1_id, 'improvement', 'Performance Optimization', 'Reduced API response times by 40%', 2),
    (v1_1_id, 'improvement', 'Enhanced Error Messages', 'More descriptive error messages for easier debugging', 3),
    (v1_1_id, 'bug_fix', 'Message Delivery Fix', 'Fixed intermittent message delivery issues in high-load scenarios', 4),
    (v1_1_id, 'bug_fix', 'Session Persistence', 'Resolved session timeout issues on mobile devices', 5);

  -- Version 1.2.0 entries
  INSERT INTO changelog_entries (version_id, category, title, description, order_index) VALUES
    (v1_2_id, 'new_feature', 'Custom Tool Builder', 'Create custom tools with visual configuration interface', 1),
    (v1_2_id, 'new_feature', 'Webhook Integration', 'Connect external services via webhooks', 2),
    (v1_2_id, 'improvement', 'Tool Execution Speed', 'Optimized tool execution pipeline for faster responses', 3),
    (v1_2_id, 'improvement', 'API Documentation', 'Expanded API documentation with interactive examples', 4),
    (v1_2_id, 'bug_fix', 'Tool Configuration Validation', 'Fixed validation errors in tool configuration forms', 5),
    (v1_2_id, 'breaking_change', 'API v1 Deprecation', 'API v1 endpoints deprecated, migrate to v2 by March 2026', 6);

  -- Version 2.0.0 entries
  INSERT INTO changelog_entries (version_id, category, title, description, order_index) VALUES
    (v2_id, 'new_feature', 'AI-Powered Tool Generation', 'Generate custom tools using natural language descriptions', 1),
    (v2_id, 'new_feature', 'Two-Factor Authentication', 'Enhanced security with TOTP-based 2FA', 2),
    (v2_id, 'new_feature', 'Admin Dashboard', 'Comprehensive admin panel for platform management', 3),
    (v2_id, 'new_feature', 'Global Search', 'Search across swarms, agents, tools, and documentation', 4),
    (v2_id, 'improvement', 'Complete UI Redesign', 'Modern, accessible interface with dark mode support', 5),
    (v2_id, 'improvement', 'Mobile Experience', 'Fully responsive design optimized for all devices', 6),
    (v2_id, 'improvement', 'Real-time Presence', 'See who is viewing and editing swarms in real-time', 7),
    (v2_id, 'bug_fix', 'Memory Leak Fix', 'Resolved memory leak in long-running agent sessions', 8),
    (v2_id, 'breaking_change', 'Authentication Flow', 'New authentication flow requires re-login after upgrade', 9);
END $$;
