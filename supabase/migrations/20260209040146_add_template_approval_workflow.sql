/*
  # Add Template Approval Workflow

  1. Modified Tables
    - `team_templates`
      - `status` (text, default 'draft') - workflow status: draft, pending_review, approved, rejected, changes_requested
      - `submitted_at` (timestamptz, nullable) - when template was submitted for review
      - `reviewed_by` (uuid, nullable, FK to auth.users) - who last reviewed
      - `reviewed_at` (timestamptz, nullable) - when last reviewed
      - `review_feedback` (text, nullable) - reviewer feedback/notes

  2. New Tables
    - `template_approval_history`
      - `id` (uuid, primary key) - unique record identifier
      - `template_id` (uuid, FK to team_templates) - the template being reviewed
      - `action` (text) - action taken: submitted, approved, rejected, changes_requested, resubmitted
      - `performed_by` (uuid, FK to auth.users) - who performed the action
      - `feedback` (text, nullable) - optional feedback from reviewer
      - `previous_status` (text) - status before the action
      - `new_status` (text) - status after the action
      - `created_at` (timestamptz) - when the action occurred

  3. Security
    - RLS enabled on `template_approval_history`
    - SELECT: org members can view history for their org's templates
    - INSERT: org admins can insert review actions; creators can insert submit actions

  4. Policy Updates
    - Updated SELECT on `team_templates` so regular members only see approved templates,
      while admins and template creators can see all statuses

  5. Indexes
    - `idx_template_approval_history_template` on template_id
    - `idx_team_templates_status` on (organization_id, status)

  6. Notes
    - Templates start in 'draft' status visible only to the creator and org admins
    - Regular members only see templates with 'approved' status
    - The approval_history table serves as a full audit trail
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_templates' AND column_name = 'status'
  ) THEN
    ALTER TABLE team_templates ADD COLUMN status text NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'changes_requested'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_templates' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE team_templates ADD COLUMN submitted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_templates' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE team_templates ADD COLUMN reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_templates' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE team_templates ADD COLUMN reviewed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_templates' AND column_name = 'review_feedback'
  ) THEN
    ALTER TABLE team_templates ADD COLUMN review_feedback text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_team_templates_status ON team_templates(organization_id, status);

DROP POLICY IF EXISTS "Org members can view team templates" ON team_templates;

CREATE POLICY "Org members can view approved team templates"
  ON team_templates FOR SELECT
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid())
    OR created_by = auth.uid()
    OR (
      is_org_member(organization_id, auth.uid())
      AND status = 'approved'
      AND is_active = true
    )
  );

CREATE TABLE IF NOT EXISTS template_approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES team_templates(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'changes_requested', 'resubmitted', 'draft_created')),
  performed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback text,
  previous_status text NOT NULL,
  new_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE template_approval_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_template_approval_history_template ON template_approval_history(template_id);

CREATE POLICY "Org members can view approval history for their templates"
  ON template_approval_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_templates tt
      WHERE tt.id = template_approval_history.template_id
      AND is_org_member(tt.organization_id, auth.uid())
    )
  );

CREATE POLICY "Org admins and creators can insert approval actions"
  ON template_approval_history FOR INSERT
  TO authenticated
  WITH CHECK (
    performed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_templates tt
      WHERE tt.id = template_approval_history.template_id
      AND (
        is_org_admin(tt.organization_id, auth.uid())
        OR tt.created_by = auth.uid()
      )
    )
  );
