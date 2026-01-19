/*
  # Create User Integrations Table

  1. New Tables
    - `user_integrations`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References auth.users
      - `integration_type` (text) - Type of integration (e.g., 'openai', 'slack', 'github')
      - `name` (text) - Display name for the integration
      - `credentials` (jsonb) - Encrypted credentials stored as JSON
      - `is_connected` (boolean) - Whether the integration is currently active
      - `last_used_at` (timestamptz) - Last time credentials were used
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on user_integrations table
    - Users can only access their own integrations
    - Credentials are stored encrypted (application-level encryption recommended)

  3. Notes
    - The credentials column stores encrypted data
    - Application should encrypt before storing and decrypt after retrieval
    - Never log or expose raw credentials
*/

CREATE TABLE IF NOT EXISTS user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_type text NOT NULL,
  name text NOT NULL,
  credentials jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_connected boolean DEFAULT false NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, integration_type)
);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_type ON user_integrations(integration_type);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own integrations" ON user_integrations;
CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own integrations" ON user_integrations;
CREATE POLICY "Users can create own integrations"
  ON user_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own integrations" ON user_integrations;
CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own integrations" ON user_integrations;
CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_integrations_updated_at ON user_integrations;
CREATE TRIGGER trigger_update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_integrations_updated_at();
