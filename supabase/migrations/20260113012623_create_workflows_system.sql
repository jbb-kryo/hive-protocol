/*
  # Workflow Automation System

  Creates comprehensive workflow automation system with visual builder support.

  ## New Tables
  - workflows - Main workflow definitions
  - workflow_nodes - Visual builder nodes
  - workflow_edges - Connections between nodes
  - workflow_executions - Execution history
  - workflow_execution_steps - Individual step executions
  - workflow_webhooks - Webhook triggers
  - workflow_schedules - Schedule triggers
*/

CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  trigger_type text DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'webhook', 'schedule', 'event')),
  trigger_config jsonb DEFAULT '{}',
  is_template boolean DEFAULT false,
  template_category text DEFAULT '',
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  node_type text NOT NULL CHECK (node_type IN ('trigger', 'condition', 'action', 'delay', 'loop', 'end')),
  action_type text DEFAULT '',
  label text NOT NULL,
  config jsonb DEFAULT '{}',
  position_x float DEFAULT 0,
  position_y float DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  source_node_id uuid REFERENCES workflow_nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id uuid REFERENCES workflow_nodes(id) ON DELETE CASCADE NOT NULL,
  source_handle text DEFAULT 'default',
  label text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  trigger_type text NOT NULL,
  trigger_data jsonb DEFAULT '{}',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text DEFAULT '',
  duration_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_execution_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid REFERENCES workflow_executions(id) ON DELETE CASCADE NOT NULL,
  node_id uuid REFERENCES workflow_nodes(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  input_data jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  error_message text DEFAULT '',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE UNIQUE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE UNIQUE NOT NULL,
  cron_expression text NOT NULL DEFAULT '0 0 * * *',
  timezone text DEFAULT 'UTC',
  is_active boolean DEFAULT true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_user ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_template ON workflows(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow ON workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_workflow ON workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_source ON workflow_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_target ON workflow_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created ON workflow_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_steps_execution ON workflow_execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_webhooks_token ON workflow_webhooks(token);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next ON workflow_schedules(next_run_at) WHERE is_active = true;

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own or team workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_template = true OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workflows.organization_id
      AND organization_members.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create workflows"
  ON workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      organization_id IS NULL OR
      EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.organization_id = workflows.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin', 'member')
      )
    )
  );

CREATE POLICY "Users can update their own or team workflows"
  ON workflows FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workflows.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "Users can delete their own or team workflows"
  ON workflows FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workflows.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    ))
  );

CREATE POLICY "Users can view nodes of accessible workflows"
  ON workflow_nodes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_nodes.workflow_id
      AND (
        workflows.user_id = auth.uid() OR
        workflows.is_template = true OR
        (workflows.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = workflows.organization_id
          AND organization_members.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can manage nodes of their workflows"
  ON workflow_nodes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_nodes.workflow_id
      AND (
        workflows.user_id = auth.uid() OR
        (workflows.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = workflows.organization_id
          AND organization_members.user_id = auth.uid()
          AND organization_members.role IN ('owner', 'admin', 'member')
        ))
      )
    )
  );

CREATE POLICY "Users can view edges of accessible workflows"
  ON workflow_edges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_edges.workflow_id
      AND (
        workflows.user_id = auth.uid() OR
        workflows.is_template = true OR
        (workflows.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = workflows.organization_id
          AND organization_members.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can manage edges of their workflows"
  ON workflow_edges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_edges.workflow_id
      AND (
        workflows.user_id = auth.uid() OR
        (workflows.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = workflows.organization_id
          AND organization_members.user_id = auth.uid()
          AND organization_members.role IN ('owner', 'admin', 'member')
        ))
      )
    )
  );

CREATE POLICY "Users can view executions of accessible workflows"
  ON workflow_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_executions.workflow_id
      AND (
        workflows.user_id = auth.uid() OR
        (workflows.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = workflows.organization_id
          AND organization_members.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can create executions of their workflows"
  ON workflow_executions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_executions.workflow_id
      AND (
        workflows.user_id = auth.uid() OR
        (workflows.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = workflows.organization_id
          AND organization_members.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can view execution steps"
  ON workflow_execution_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_executions
      JOIN workflows ON workflows.id = workflow_executions.workflow_id
      WHERE workflow_executions.id = workflow_execution_steps.execution_id
      AND (
        workflows.user_id = auth.uid() OR
        (workflows.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = workflows.organization_id
          AND organization_members.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can manage webhooks of their workflows"
  ON workflow_webhooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_webhooks.workflow_id
      AND (
        workflows.user_id = auth.uid() OR
        (workflows.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = workflows.organization_id
          AND organization_members.user_id = auth.uid()
          AND organization_members.role IN ('owner', 'admin')
        ))
      )
    )
  );

CREATE POLICY "Users can manage schedules of their workflows"
  ON workflow_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_schedules.workflow_id
      AND (
        workflows.user_id = auth.uid() OR
        (workflows.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = workflows.organization_id
          AND organization_members.user_id = auth.uid()
          AND organization_members.role IN ('owner', 'admin')
        ))
      )
    )
  );