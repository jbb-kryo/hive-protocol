/*
  # Add Custom Tool Fields

  1. Changes to `tools` table
    - `is_custom` (boolean) - Whether this is a user-generated custom tool
    - `is_system` (boolean) - Whether this is a built-in system tool
    - `input_schema` (jsonb) - JSON Schema defining expected inputs
    - `output_schema` (jsonb) - JSON Schema defining expected outputs
    - `wrapper_code` (text) - Generated wrapper/execution code
    - `icon` (text) - Icon name for the tool
    - `category` (text) - Tool category
    - `status` (text) - Tool status (draft, active, archived)

  2. Security
    - Existing RLS policies apply
    - Add policy for viewing system tools
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'is_custom'
  ) THEN
    ALTER TABLE tools ADD COLUMN is_custom boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'is_system'
  ) THEN
    ALTER TABLE tools ADD COLUMN is_system boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'input_schema'
  ) THEN
    ALTER TABLE tools ADD COLUMN input_schema jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'output_schema'
  ) THEN
    ALTER TABLE tools ADD COLUMN output_schema jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'wrapper_code'
  ) THEN
    ALTER TABLE tools ADD COLUMN wrapper_code text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'icon'
  ) THEN
    ALTER TABLE tools ADD COLUMN icon text DEFAULT 'Wrench';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'category'
  ) THEN
    ALTER TABLE tools ADD COLUMN category text DEFAULT 'Custom';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'status'
  ) THEN
    ALTER TABLE tools ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tools_is_custom ON tools(is_custom);
CREATE INDEX IF NOT EXISTS idx_tools_is_system ON tools(is_system);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);

DROP POLICY IF EXISTS "Users can view system tools" ON tools;
CREATE POLICY "Users can view system tools"
  ON tools FOR SELECT
  TO authenticated
  USING (is_system = true);

UPDATE tools SET is_system = true WHERE created_by IS NULL;
