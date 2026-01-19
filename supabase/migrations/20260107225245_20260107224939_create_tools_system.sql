/*
  # Create Tools System

  1. New Tables
    - `tools`
      - `id` (uuid, primary key)
      - `name` (text) - Tool name
      - `description` (text) - Tool description/purpose
      - `capabilities` (jsonb) - Tool capabilities and configuration
      - `created_by` (uuid) - References auth.users
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `swarm_tools`
      - `id` (uuid, primary key)
      - `swarm_id` (uuid) - References swarms table
      - `tool_id` (uuid) - References tools table
      - `assigned_at` (timestamptz)
      - Unique constraint on (swarm_id, tool_id)
    
    - `tool_usage`
      - `id` (uuid, primary key)
      - `tool_id` (uuid) - References tools table
      - `swarm_id` (uuid) - References swarms table
      - `action_type` (text) - Type of action (e.g., 'invoked', 'completed', 'failed')
      - `metadata` (jsonb) - Additional usage metadata
      - `used_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can create tools
    - Users can view tools they created or tools assigned to their swarms
    - Swarm owners can assign tools to their swarms
    - Tool usage is tracked automatically
*/

-- Create tools table
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  capabilities jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create swarm_tools junction table
CREATE TABLE IF NOT EXISTS swarm_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id uuid REFERENCES swarms(id) ON DELETE CASCADE NOT NULL,
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(swarm_id, tool_id)
);

-- Create tool_usage table
CREATE TABLE IF NOT EXISTS tool_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  swarm_id uuid REFERENCES swarms(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL DEFAULT 'invoked',
  metadata jsonb DEFAULT '{}'::jsonb,
  used_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tools_created_by ON tools(created_by);
CREATE INDEX IF NOT EXISTS idx_swarm_tools_swarm_id ON swarm_tools(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_tools_tool_id ON swarm_tools(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_id ON tool_usage(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_swarm_id ON tool_usage(swarm_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_used_at ON tool_usage(used_at DESC);

-- Enable RLS
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tools table
CREATE POLICY "Users can create tools"
  ON tools FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own tools"
  ON tools FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can view tools assigned to their swarms"
  ON tools FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM swarm_tools st
      JOIN swarms s ON st.swarm_id = s.id
      WHERE st.tool_id = tools.id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own tools"
  ON tools FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own tools"
  ON tools FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for swarm_tools table
CREATE POLICY "Swarm owners can assign tools"
  ON swarm_tools FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM swarms
      WHERE swarms.id = swarm_tools.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view tools assigned to their swarms"
  ON swarm_tools FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM swarms
      WHERE swarms.id = swarm_tools.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

CREATE POLICY "Swarm owners can remove tool assignments"
  ON swarm_tools FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM swarms
      WHERE swarms.id = swarm_tools.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

-- RLS Policies for tool_usage table
CREATE POLICY "Users can log tool usage for their swarms"
  ON tool_usage FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM swarms
      WHERE swarms.id = tool_usage.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view tool usage for their swarms"
  ON tool_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM swarms
      WHERE swarms.id = tool_usage.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS tools_updated_at_trigger ON tools;
CREATE TRIGGER tools_updated_at_trigger
  BEFORE UPDATE ON tools
  FOR EACH ROW
  EXECUTE FUNCTION update_tools_updated_at();
