/*
  # Add Tool Version Tracking

  1. New Tables
    - `tool_versions`
      - `id` (uuid, primary key)
      - `tool_id` (uuid) - References tools table
      - `version` (integer) - Version number
      - `name` (text) - Tool name at this version
      - `description` (text) - Tool description at this version
      - `input_schema` (jsonb) - Input schema at this version
      - `output_schema` (jsonb) - Output schema at this version
      - `wrapper_code` (text) - Wrapper code at this version
      - `capabilities` (jsonb) - Capabilities at this version
      - `created_at` (timestamptz)
      - `created_by` (uuid) - User who created this version

  2. Changes to `tools` table
    - `version` (integer) - Current version number

  3. Security
    - Enable RLS on tool_versions table
    - Users can view versions of their own tools
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'version'
  ) THEN
    ALTER TABLE tools ADD COLUMN version integer DEFAULT 1;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tool_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  version integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  description text NOT NULL,
  input_schema jsonb DEFAULT '{}'::jsonb,
  output_schema jsonb DEFAULT '{}'::jsonb,
  wrapper_code text,
  capabilities jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(tool_id, version)
);

CREATE INDEX IF NOT EXISTS idx_tool_versions_tool_id ON tool_versions(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_versions_version ON tool_versions(version DESC);

ALTER TABLE tool_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view versions of their tools" ON tool_versions;
CREATE POLICY "Users can view versions of their tools"
  ON tool_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      WHERE tools.id = tool_versions.tool_id
      AND tools.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create versions for their tools" ON tool_versions;
CREATE POLICY "Users can create versions for their tools"
  ON tool_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tools
      WHERE tools.id = tool_versions.tool_id
      AND tools.created_by = auth.uid()
    )
  );
