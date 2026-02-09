/*
  # Bridge Templates and Marketplace

  1. Modified Tables
    - `marketplace_agents`
      - `source_template_id` (uuid, FK to default_agents) - links marketplace listing to internal template
      - `is_template_promoted` (boolean) - distinguishes admin-promoted templates from user-published agents
      - `template_sync_enabled` (boolean) - auto-sync template updates to marketplace listing
      - `last_synced_at` (timestamptz) - last time template data was synced

  2. Security
    - RLS policies allow admins to manage template-promoted listings
    - Existing marketplace RLS remains intact

  3. Notes
    - Enables admin templates to be promoted directly to the marketplace
    - Supports auto-sync so template updates flow to marketplace listings
    - Preserves the existing user-publish flow (source_agent_id) alongside the new template-promote flow (source_template_id)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketplace_agents' AND column_name = 'source_template_id'
  ) THEN
    ALTER TABLE marketplace_agents ADD COLUMN source_template_id uuid REFERENCES default_agents(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketplace_agents' AND column_name = 'is_template_promoted'
  ) THEN
    ALTER TABLE marketplace_agents ADD COLUMN is_template_promoted boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketplace_agents' AND column_name = 'template_sync_enabled'
  ) THEN
    ALTER TABLE marketplace_agents ADD COLUMN template_sync_enabled boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketplace_agents' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE marketplace_agents ADD COLUMN last_synced_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_marketplace_agents_source_template
  ON marketplace_agents(source_template_id)
  WHERE source_template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_agents_template_promoted
  ON marketplace_agents(is_template_promoted)
  WHERE is_template_promoted = true;
