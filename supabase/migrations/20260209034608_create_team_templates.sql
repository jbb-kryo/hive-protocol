/*
  # Create Team Templates System

  1. New Tables
    - `team_templates`
      - `id` (uuid, primary key) - unique template identifier
      - `organization_id` (uuid, FK to organizations) - owning team
      - `created_by` (uuid, FK to auth.users) - template creator
      - `name` (text) - template name
      - `role` (text, nullable) - agent role
      - `framework` (text, default 'anthropic') - AI framework
      - `model_id` (uuid, FK to ai_models, nullable) - optional model
      - `system_prompt` (text, nullable) - agent system prompt
      - `description` (text, nullable) - template description
      - `tags` (text[], default '{}') - searchable tags
      - `category` (text, default 'general') - template category
      - `icon` (text, default 'Bot') - icon identifier
      - `settings` (jsonb, default '{}') - configuration
      - `permission_level` (text, default 'use') - default access: view, use, edit
      - `is_active` (boolean, default true) - whether template is available
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp

  2. Security
    - RLS enabled on `team_templates`
    - SELECT: organization members can view their team's templates
    - INSERT: organization admins and owners can create templates
    - UPDATE: organization admins, owners, or the template creator can edit
    - DELETE: organization admins, owners, or the template creator can delete

  3. Indexes
    - `idx_team_templates_org_id` on organization_id for fast team lookups
    - `idx_team_templates_created_by` on created_by
    - `idx_team_templates_category` on category for filtering

  4. Notes
    - Uses existing `is_org_member` and `is_org_admin` security definer functions
    - `permission_level` controls default access for members: view (read-only), use (can clone), edit (can modify)
    - Team templates are completely separate from public templates (default_agents)
*/

CREATE TABLE IF NOT EXISTS team_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  framework text NOT NULL DEFAULT 'anthropic',
  model_id uuid,
  system_prompt text,
  description text,
  tags text[] DEFAULT '{}',
  category text NOT NULL DEFAULT 'general',
  icon text NOT NULL DEFAULT 'Bot',
  settings jsonb DEFAULT '{}',
  permission_level text NOT NULL DEFAULT 'use' CHECK (permission_level IN ('view', 'use', 'edit')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE team_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_team_templates_org_id ON team_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_templates_created_by ON team_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_team_templates_category ON team_templates(organization_id, category);

CREATE POLICY "Org members can view team templates"
  ON team_templates FOR SELECT
  TO authenticated
  USING (
    is_org_member(organization_id, auth.uid())
  );

CREATE POLICY "Org admins and owners can create team templates"
  ON team_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_admin(organization_id, auth.uid())
    OR (
      is_org_member(organization_id, auth.uid())
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins owners or creator can update team templates"
  ON team_templates FOR UPDATE
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid())
    OR created_by = auth.uid()
  )
  WITH CHECK (
    is_org_admin(organization_id, auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Admins owners or creator can delete team templates"
  ON team_templates FOR DELETE
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid())
    OR created_by = auth.uid()
  );
