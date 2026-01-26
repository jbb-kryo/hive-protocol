/*
  # Template Version Management

  ## Overview
  This migration adds version tracking to agent templates, allowing admins to update templates
  while users retain their original cloned versions with optional upgrade paths.

  ## Schema Changes

  ### 1. `default_agents` (templates) additions:
    - `version` (text) - Semantic version string (e.g., "1.0.0")
    - `changelog` (text) - Description of changes in this version
    - `previous_version_id` (uuid) - Reference to previous version for history chain

  ### 2. `agents` (user agents) additions:
    - `source_template_id` (uuid) - Reference to the template this was cloned from
    - `source_template_version` (text) - Version of template at time of cloning

  ## Security
  - No changes to existing RLS policies needed
  - Version information is read-only for regular users

  ## Indexes
  - Index on source_template_id for efficient lookups
  - Index on version for history queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'version'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN version text DEFAULT '1.0.0';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'changelog'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN changelog text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'previous_version_id'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN previous_version_id uuid REFERENCES default_agents(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'source_template_id'
  ) THEN
    ALTER TABLE agents ADD COLUMN source_template_id uuid REFERENCES default_agents(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'source_template_version'
  ) THEN
    ALTER TABLE agents ADD COLUMN source_template_version text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agents_source_template ON agents(source_template_id);
CREATE INDEX IF NOT EXISTS idx_default_agents_version ON default_agents(version);
CREATE INDEX IF NOT EXISTS idx_default_agents_previous_version ON default_agents(previous_version_id);

UPDATE default_agents SET version = '1.0.0' WHERE version IS NULL;
UPDATE default_agents SET changelog = 'Initial release' WHERE changelog IS NULL OR changelog = '';
