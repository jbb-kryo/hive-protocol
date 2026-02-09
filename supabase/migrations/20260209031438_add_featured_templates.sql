/*
  # Add Featured Templates Support

  1. Modified Tables
    - `default_agents`
      - `is_featured` (boolean, default false) - whether the template is currently featured
      - `featured_until` (timestamptz, nullable) - optional expiration date for featured status
      - `featured_at` (timestamptz, nullable) - when it was featured, for ordering

  2. Notes
    - Featured templates get prominent placement on the templates page
    - featured_until allows time-limited featuring that auto-expires
    - featured_at is used to order featured templates by recency
    - Application logic enforces a max of 6 featured templates at a time
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'featured_until'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN featured_until timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'featured_at'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN featured_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_default_agents_featured ON default_agents(is_featured) WHERE is_featured = true;
