/*
  # Create User Tools Table

  1. New Tables
    - `user_tools`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References auth.users
      - `tool_id` (uuid) - References tools table
      - `enabled` (boolean) - Whether tool is enabled for user
      - `configuration` (jsonb) - Tool-specific configuration
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on (user_id, tool_id)

  2. Seed Data
    - Insert default system tools for all users to discover

  3. Security
    - Enable RLS on user_tools
    - Users can only manage their own tool preferences
*/

-- Create user_tools table
CREATE TABLE IF NOT EXISTS user_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  enabled boolean DEFAULT false,
  configuration jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_tools_user_id ON user_tools(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tools_tool_id ON user_tools(tool_id);
CREATE INDEX IF NOT EXISTS idx_user_tools_enabled ON user_tools(user_id, enabled);

-- Enable RLS
ALTER TABLE user_tools ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tool preferences"
  ON user_tools FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tool preferences"
  ON user_tools FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tool preferences"
  ON user_tools FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tool preferences"
  ON user_tools FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS user_tools_updated_at_trigger ON user_tools;
CREATE TRIGGER user_tools_updated_at_trigger
  BEFORE UPDATE ON user_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tools_updated_at();

-- Insert default system tools (these are discoverable by all users)
-- First, allow viewing system tools
CREATE POLICY "Users can view system tools"
  ON tools FOR SELECT
  TO authenticated
  USING (created_by IS NULL);

-- Insert system tools
INSERT INTO tools (id, name, description, capabilities, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Web Search', 'Search the web for real-time information', '{"category": "Research", "requires_config": false}'::jsonb, NULL),
  ('00000000-0000-0000-0000-000000000002', 'Web Browser', 'Navigate and interact with web pages', '{"category": "Research", "requires_config": false}'::jsonb, NULL),
  ('00000000-0000-0000-0000-000000000003', 'Code Executor', 'Run Python, JavaScript, and more', '{"category": "Development", "requires_config": false}'::jsonb, NULL),
  ('00000000-0000-0000-0000-000000000004', 'File Operations', 'Read, write, and manage files', '{"category": "Development", "requires_config": false}'::jsonb, NULL),
  ('00000000-0000-0000-0000-000000000005', 'Database Query', 'Query SQL and NoSQL databases', '{"category": "Data", "requires_config": true, "config_fields": [{"name": "connection_string", "type": "password", "label": "Connection String", "required": true}, {"name": "database_type", "type": "select", "label": "Database Type", "options": ["PostgreSQL", "MySQL", "MongoDB", "SQLite"], "required": true}]}'::jsonb, NULL),
  ('00000000-0000-0000-0000-000000000006', 'Email Sender', 'Send emails via SMTP or API', '{"category": "Communication", "requires_config": true, "config_fields": [{"name": "smtp_host", "type": "text", "label": "SMTP Host", "required": true}, {"name": "smtp_port", "type": "number", "label": "SMTP Port", "required": true}, {"name": "smtp_user", "type": "text", "label": "Username", "required": true}, {"name": "smtp_password", "type": "password", "label": "Password", "required": true}]}'::jsonb, NULL),
  ('00000000-0000-0000-0000-000000000007', 'Calendar Manager', 'Manage calendar events and schedules', '{"category": "Productivity", "requires_config": true, "config_fields": [{"name": "calendar_provider", "type": "select", "label": "Calendar Provider", "options": ["Google Calendar", "Microsoft Outlook", "Apple Calendar"], "required": true}, {"name": "api_key", "type": "password", "label": "API Key", "required": true}]}'::jsonb, NULL),
  ('00000000-0000-0000-0000-000000000008', 'Image Generator', 'Generate images with AI', '{"category": "Creative", "requires_config": true, "config_fields": [{"name": "provider", "type": "select", "label": "Provider", "options": ["DALL-E", "Stable Diffusion", "Midjourney"], "required": true}, {"name": "api_key", "type": "password", "label": "API Key", "required": true}]}'::jsonb, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  capabilities = EXCLUDED.capabilities;
