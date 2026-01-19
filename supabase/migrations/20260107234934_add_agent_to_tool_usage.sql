/*
  # Add agent_id to tool_usage table

  1. Changes
    - Add `agent_id` column to `tool_usage` table to track which agent used each tool
    - Add foreign key constraint to agents table
    - Add index for efficient queries by agent

  2. Notes
    - Column is nullable to support existing records and anonymous tool usage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tool_usage' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE tool_usage ADD COLUMN agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tool_usage_agent_id ON tool_usage(agent_id);