/*
  # Add Organization Support to Existing Resources

  Adds organization_id fields to agents, swarms, and tools tables
  with updated RLS policies for team access.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE agents ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_agents_organization ON agents(organization_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'swarms' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE swarms ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_swarms_organization ON swarms(organization_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE tools ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_tools_organization ON tools(organization_id);
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
DROP POLICY IF EXISTS "Users can create agents" ON agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;

CREATE POLICY "Users can view their own or team agents"
  ON agents FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = agents.organization_id
      AND organization_members.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create personal agents or team agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND organization_id IS NULL) OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = agents.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "Users can update their own agents or team agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = agents.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "Users can delete their own agents or team agents"
  ON agents FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = agents.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    ))
  );

DROP POLICY IF EXISTS "Users can view their own swarms" ON swarms;
DROP POLICY IF EXISTS "Users can create swarms" ON swarms;
DROP POLICY IF EXISTS "Users can update their own swarms" ON swarms;
DROP POLICY IF EXISTS "Users can delete their own swarms" ON swarms;
DROP POLICY IF EXISTS "Users can view shared swarms" ON swarms;

CREATE POLICY "Users can view their own or team swarms"
  ON swarms FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = swarms.organization_id
      AND organization_members.user_id = auth.uid()
    )) OR
    (visibility = 'public' AND share_token IS NOT NULL)
  );

CREATE POLICY "Users can create personal or team swarms"
  ON swarms FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND organization_id IS NULL) OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = swarms.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "Users can update their own or team swarms"
  ON swarms FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = swarms.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "Users can delete their own or team swarms"
  ON swarms FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = swarms.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    ))
  );

DROP POLICY IF EXISTS "Users can view their own tools" ON tools;
DROP POLICY IF EXISTS "Users can create tools" ON tools;
DROP POLICY IF EXISTS "Users can update their own tools" ON tools;
DROP POLICY IF EXISTS "Users can delete their own tools" ON tools;
DROP POLICY IF EXISTS "System tools are visible to all" ON tools;

CREATE POLICY "Users can view their own or team tools"
  ON tools FOR SELECT
  TO authenticated
  USING (
    is_system = true OR
    created_by = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tools.organization_id
      AND organization_members.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create personal or team tools"
  ON tools FOR INSERT
  TO authenticated
  WITH CHECK (
    (created_by = auth.uid() AND organization_id IS NULL) OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tools.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "Users can update their own or team tools"
  ON tools FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tools.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "Users can delete their own or team tools"
  ON tools FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tools.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    ))
  );