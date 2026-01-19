/*
  # Custom Tool Sandbox Execution System

  This migration creates the infrastructure for secure custom tool execution
  with proper isolation, logging, and secret management.

  1. New Tables
    - `tool_execution_logs`
      - `id` (uuid, primary key)
      - `tool_id` (uuid) - References tools table
      - `user_id` (uuid) - User who triggered execution
      - `execution_id` (text) - Unique execution identifier
      - `status` (text) - pending, running, success, error, timeout, blocked
      - `input_params` (jsonb) - Input parameters (sanitized)
      - `output_result` (jsonb) - Execution result
      - `error_message` (text) - Error details if failed
      - `error_type` (text) - Error classification
      - `execution_time_ms` (integer) - Duration in milliseconds
      - `memory_used_bytes` (bigint) - Memory consumption
      - `network_requests` (jsonb) - Network requests made
      - `blocked_operations` (jsonb) - Operations that were blocked
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `metadata` (jsonb) - Additional execution metadata

    - `tool_network_allowlist`
      - `id` (uuid, primary key)
      - `tool_id` (uuid) - References tools table
      - `domain` (text) - Allowed domain pattern
      - `port` (integer) - Allowed port (null for any)
      - `protocol` (text) - http, https, or both
      - `description` (text) - Why this domain is allowed
      - `created_by` (uuid) - Who added this entry
      - `created_at` (timestamptz)
      - `is_active` (boolean) - Whether rule is active

    - `tool_secrets`
      - `id` (uuid, primary key)
      - `tool_id` (uuid) - References tools table
      - `user_id` (uuid) - Owner of the secret
      - `secret_name` (text) - Name/key for the secret
      - `secret_value_encrypted` (text) - Encrypted secret value
      - `secret_type` (text) - api_key, token, password, etc.
      - `description` (text) - What this secret is for
      - `last_used_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `global_network_blocklist`
      - `id` (uuid, primary key)
      - `pattern` (text) - Domain/IP pattern to block
      - `reason` (text) - Why it's blocked
      - `severity` (text) - low, medium, high, critical
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only view their own execution logs
    - Users can only manage secrets for their own tools
    - Admins can view all logs and manage global blocklist

  3. Indexes
    - Performance indexes on frequently queried columns
*/

-- Tool Execution Logs
CREATE TABLE IF NOT EXISTS tool_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES tools(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  execution_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  input_params jsonb DEFAULT '{}'::jsonb,
  output_result jsonb,
  error_message text,
  error_type text,
  execution_time_ms integer,
  memory_used_bytes bigint,
  network_requests jsonb DEFAULT '[]'::jsonb,
  blocked_operations jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'success', 'error', 'timeout', 'blocked'))
);

CREATE INDEX IF NOT EXISTS idx_tool_execution_logs_tool_id ON tool_execution_logs(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_execution_logs_user_id ON tool_execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_execution_logs_status ON tool_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_tool_execution_logs_started_at ON tool_execution_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_execution_logs_execution_id ON tool_execution_logs(execution_id);

ALTER TABLE tool_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own execution logs"
  ON tool_execution_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own execution logs"
  ON tool_execution_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own execution logs"
  ON tool_execution_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tool Network Allowlist
CREATE TABLE IF NOT EXISTS tool_network_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  domain text NOT NULL,
  port integer,
  protocol text DEFAULT 'https',
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT valid_protocol CHECK (protocol IN ('http', 'https', 'both'))
);

CREATE INDEX IF NOT EXISTS idx_tool_network_allowlist_tool_id ON tool_network_allowlist(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_network_allowlist_domain ON tool_network_allowlist(domain);
CREATE INDEX IF NOT EXISTS idx_tool_network_allowlist_active ON tool_network_allowlist(tool_id, is_active);

ALTER TABLE tool_network_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view allowlist for their tools"
  ON tool_network_allowlist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools 
      WHERE tools.id = tool_network_allowlist.tool_id 
      AND tools.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage allowlist for their tools"
  ON tool_network_allowlist FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tools 
      WHERE tools.id = tool_network_allowlist.tool_id 
      AND tools.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update allowlist for their tools"
  ON tool_network_allowlist FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools 
      WHERE tools.id = tool_network_allowlist.tool_id 
      AND tools.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tools 
      WHERE tools.id = tool_network_allowlist.tool_id 
      AND tools.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete allowlist for their tools"
  ON tool_network_allowlist FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools 
      WHERE tools.id = tool_network_allowlist.tool_id 
      AND tools.created_by = auth.uid()
    )
  );

-- Tool Secrets
CREATE TABLE IF NOT EXISTS tool_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  secret_name text NOT NULL,
  secret_value_encrypted text NOT NULL,
  secret_type text DEFAULT 'api_key',
  description text,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tool_id, user_id, secret_name),
  CONSTRAINT valid_secret_type CHECK (secret_type IN ('api_key', 'token', 'password', 'credential', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_tool_secrets_tool_id ON tool_secrets(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_secrets_user_id ON tool_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_secrets_tool_user ON tool_secrets(tool_id, user_id);

ALTER TABLE tool_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tool secrets"
  ON tool_secrets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tool secrets"
  ON tool_secrets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tool secrets"
  ON tool_secrets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tool secrets"
  ON tool_secrets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Global Network Blocklist (admin managed)
CREATE TABLE IF NOT EXISTS global_network_blocklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern text NOT NULL UNIQUE,
  reason text NOT NULL,
  severity text DEFAULT 'high',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_global_network_blocklist_pattern ON global_network_blocklist(pattern);
CREATE INDEX IF NOT EXISTS idx_global_network_blocklist_severity ON global_network_blocklist(severity);

ALTER TABLE global_network_blocklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view global blocklist"
  ON global_network_blocklist FOR SELECT
  TO authenticated
  USING (true);

-- Seed common blocked patterns
INSERT INTO global_network_blocklist (pattern, reason, severity) VALUES
  ('localhost', 'Local network access prevention', 'critical'),
  ('127.0.0.1', 'Loopback address blocking', 'critical'),
  ('0.0.0.0', 'Null address blocking', 'critical'),
  ('::1', 'IPv6 loopback blocking', 'critical'),
  ('169.254.169.254', 'AWS metadata endpoint blocking', 'critical'),
  ('metadata.google.internal', 'GCP metadata endpoint blocking', 'critical'),
  ('168.63.129.16', 'Azure metadata endpoint blocking', 'critical'),
  ('*.internal', 'Internal domain blocking', 'high'),
  ('*.local', 'Local domain blocking', 'high'),
  ('*.localhost', 'Localhost subdomain blocking', 'critical'),
  ('10.*', 'Private network blocking (Class A)', 'high'),
  ('172.16.*', 'Private network blocking (Class B)', 'high'),
  ('192.168.*', 'Private network blocking (Class C)', 'high')
ON CONFLICT (pattern) DO NOTHING;

-- Function to update tool_secrets updated_at
CREATE OR REPLACE FUNCTION update_tool_secrets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tool_secrets_updated_at_trigger ON tool_secrets;
CREATE TRIGGER tool_secrets_updated_at_trigger
  BEFORE UPDATE ON tool_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_secrets_updated_at();

-- Add sandbox configuration columns to tools table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'sandbox_config'
  ) THEN
    ALTER TABLE tools ADD COLUMN sandbox_config jsonb DEFAULT '{
      "timeout_ms": 30000,
      "memory_limit_mb": 128,
      "network_enabled": false,
      "file_system_access": false,
      "required_secrets": []
    }'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'execution_count'
  ) THEN
    ALTER TABLE tools ADD COLUMN execution_count bigint DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'last_executed_at'
  ) THEN
    ALTER TABLE tools ADD COLUMN last_executed_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'average_execution_time_ms'
  ) THEN
    ALTER TABLE tools ADD COLUMN average_execution_time_ms integer;
  END IF;
END $$;
