/*
  # Create Template Test Sandbox System

  1. New Tables
    - `template_test_conversations`
      - `id` (uuid, primary key) - unique test session ID
      - `template_id` (uuid, FK) - the template being tested (nullable for default_agents)
      - `default_agent_id` (uuid, FK) - the default agent template being tested
      - `tester_id` (uuid, FK to auth.users) - who ran the test
      - `template_version` (text) - version snapshot at test time
      - `parameter_values` (jsonb) - parameter values used during test
      - `resolved_config` (jsonb) - fully resolved template config (after inheritance)
      - `status` (text) - 'active', 'completed', 'archived'
      - `notes` (text) - tester's notes
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

    - `template_test_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, FK to template_test_conversations)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text)
      - `response_time_ms` (int) - how long the response took
      - `metadata` (jsonb) - model info, tokens used, etc.
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Only the tester can access their own test conversations
    - Admins (profile role = 'admin') can read all test conversations

  3. Indexes
    - template_id, default_agent_id, tester_id, status on conversations
    - conversation_id on messages
*/

CREATE TABLE IF NOT EXISTS template_test_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES team_templates(id) ON DELETE SET NULL,
  default_agent_id uuid REFERENCES default_agents(id) ON DELETE SET NULL,
  tester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_version text DEFAULT '1.0.0',
  parameter_values jsonb DEFAULT '{}',
  resolved_config jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE template_test_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Testers can view own test conversations"
  ON template_test_conversations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = tester_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Testers can create test conversations"
  ON template_test_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tester_id);

CREATE POLICY "Testers can update own test conversations"
  ON template_test_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = tester_id)
  WITH CHECK (auth.uid() = tester_id);

CREATE POLICY "Testers can delete own test conversations"
  ON template_test_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = tester_id);

CREATE INDEX IF NOT EXISTS idx_test_conv_template ON template_test_conversations(template_id);
CREATE INDEX IF NOT EXISTS idx_test_conv_default_agent ON template_test_conversations(default_agent_id);
CREATE INDEX IF NOT EXISTS idx_test_conv_tester ON template_test_conversations(tester_id);
CREATE INDEX IF NOT EXISTS idx_test_conv_status ON template_test_conversations(status);

CREATE TABLE IF NOT EXISTS template_test_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES template_test_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  response_time_ms int,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE template_test_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Testers can view messages for own conversations"
  ON template_test_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM template_test_conversations c
      WHERE c.id = template_test_messages.conversation_id
      AND (
        c.tester_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Testers can create messages for own conversations"
  ON template_test_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM template_test_conversations c
      WHERE c.id = template_test_messages.conversation_id
      AND c.tester_id = auth.uid()
    )
  );

CREATE POLICY "Testers can delete messages for own conversations"
  ON template_test_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM template_test_conversations c
      WHERE c.id = template_test_messages.conversation_id
      AND c.tester_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_test_msg_conversation ON template_test_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_test_msg_created ON template_test_messages(created_at);
