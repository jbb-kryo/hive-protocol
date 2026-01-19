/*
  # Create agent_tools junction table

  1. New Tables
    - `agent_tools`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, references agents)
      - `tool_id` (uuid, references tools)
      - `enabled` (boolean, default true)
      - `settings` (jsonb, tool-specific settings per agent)
      - `assigned_at` (timestamp)

  2. Security
    - Enable RLS on `agent_tools` table
    - Add policies for users to manage their own agent tools

  3. Indexes
    - Unique constraint on agent_id + tool_id to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS agent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, tool_id)
);

ALTER TABLE agent_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agent tools"
  ON agent_tools
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_tools.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create agent tools for their agents"
  ON agent_tools
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_tools.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their agent tools"
  ON agent_tools
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_tools.agent_id
      AND agents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_tools.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their agent tools"
  ON agent_tools
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_tools.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE INDEX idx_agent_tools_agent_id ON agent_tools(agent_id);
CREATE INDEX idx_agent_tools_tool_id ON agent_tools(tool_id);