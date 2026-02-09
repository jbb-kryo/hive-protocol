/*
  # Add Template Inheritance Support

  1. Modified Tables
    - `team_templates`
      - `parent_template_id` (uuid, nullable, FK to team_templates) - references the parent template for inheritance
      - `inheritance_mode` (text, default 'inherit') - how the child relates to parent: 'inherit' or 'compose'
      - `override_fields` (text[], default '{}') - which fields the child explicitly overrides vs inherits

  2. New Indexes
    - `idx_team_templates_parent` on parent_template_id for fast hierarchy lookups

  3. Security
    - No new RLS policies needed; existing org-membership policies already cover the new columns

  4. Constraints
    - FK on parent_template_id with SET NULL on delete (parent removal does not break children)
    - CHECK constraint prevents a template from being its own parent
    - inheritance_mode must be 'inherit' or 'compose'

  5. Notes
    - Circular reference prevention is handled at application level with a recursive CTE check function
    - Children in 'inherit' mode take parent values for any non-overridden fields
    - Children in 'compose' mode merge system prompts from parent and child
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_templates' AND column_name = 'parent_template_id'
  ) THEN
    ALTER TABLE team_templates
      ADD COLUMN parent_template_id uuid REFERENCES team_templates(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_templates' AND column_name = 'inheritance_mode'
  ) THEN
    ALTER TABLE team_templates
      ADD COLUMN inheritance_mode text NOT NULL DEFAULT 'inherit'
      CHECK (inheritance_mode IN ('inherit', 'compose'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_templates' AND column_name = 'override_fields'
  ) THEN
    ALTER TABLE team_templates
      ADD COLUMN override_fields text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

ALTER TABLE team_templates
  DROP CONSTRAINT IF EXISTS team_templates_no_self_parent;

ALTER TABLE team_templates
  ADD CONSTRAINT team_templates_no_self_parent
  CHECK (parent_template_id IS NULL OR parent_template_id != id);

CREATE INDEX IF NOT EXISTS idx_team_templates_parent ON team_templates(parent_template_id);

CREATE OR REPLACE FUNCTION check_template_circular_ref(
  p_template_id uuid,
  p_parent_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH RECURSIVE chain AS (
    SELECT id, parent_template_id, 1 AS depth
    FROM team_templates
    WHERE id = p_parent_id
    UNION ALL
    SELECT t.id, t.parent_template_id, c.depth + 1
    FROM team_templates t
    JOIN chain c ON t.id = c.parent_template_id
    WHERE c.depth < 10
  )
  SELECT NOT EXISTS (
    SELECT 1 FROM chain WHERE id = p_template_id
  );
$$;
