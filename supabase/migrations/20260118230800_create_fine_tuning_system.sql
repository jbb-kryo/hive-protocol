/*
  # AI Model Fine-tuning System

  ## Overview
  This migration creates a comprehensive fine-tuning system for AI models, allowing users
  to create custom fine-tuned models based on their conversation history.

  ## New Tables

  ### 1. `fine_tuning_datasets`
  Training datasets for fine-tuning
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text) - Dataset name
  - `description` (text) - Dataset description
  - `source_type` (text) - 'conversations', 'manual', 'imported'
  - `agent_ids` (uuid[]) - Source agents for conversations
  - `swarm_ids` (uuid[]) - Source swarms for conversations
  - `date_range_start` (date) - Start date for conversation data
  - `date_range_end` (date) - End date for conversation data
  - `filters` (jsonb) - Additional filters (success_status, satisfaction_rating, etc.)
  - `total_examples` (integer) - Total training examples
  - `file_id` (text) - OpenAI file ID after upload
  - `file_size_bytes` (bigint) - File size
  - `status` (text) - 'preparing', 'ready', 'uploaded', 'error'
  - `error_message` (text) - Error details if failed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `fine_tuning_jobs`
  Fine-tuning job tracking
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `dataset_id` (uuid, references fine_tuning_datasets)
  - `name` (text) - Job name
  - `base_model` (text) - Base model (gpt-4o-mini-2024-07-18, etc.)
  - `hyperparameters` (jsonb) - Training hyperparameters
  - `openai_job_id` (text) - OpenAI fine-tuning job ID
  - `status` (text) - 'validating_files', 'queued', 'running', 'succeeded', 'failed', 'cancelled'
  - `trained_tokens` (bigint) - Number of tokens trained
  - `epochs` (integer) - Number of epochs completed
  - `estimated_cost_usd` (decimal) - Estimated cost
  - `actual_cost_usd` (decimal) - Actual cost after completion
  - `fine_tuned_model` (text) - Fine-tuned model ID from OpenAI
  - `error_message` (text) - Error details if failed
  - `started_at` (timestamptz) - When job started
  - `completed_at` (timestamptz) - When job completed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `fine_tuned_models`
  Deployed fine-tuned models
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `fine_tuning_job_id` (uuid, references fine_tuning_jobs)
  - `name` (text) - Model display name
  - `description` (text) - Model description
  - `openai_model_id` (text) - OpenAI model ID
  - `base_model` (text) - Base model used
  - `is_active` (boolean) - Whether model is active
  - `total_usage_tokens` (bigint) - Total tokens used
  - `total_usage_cost_usd` (decimal) - Total cost of usage
  - `performance_notes` (text) - Notes on model performance
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `agent_fine_tuned_models`
  Association between agents and fine-tuned models
  - `id` (uuid, primary key)
  - `agent_id` (uuid, references agents)
  - `fine_tuned_model_id` (uuid, references fine_tuned_models)
  - `is_active` (boolean) - Whether this model is active for the agent
  - `created_at` (timestamptz)

  ### 5. `fine_tuning_training_examples`
  Individual training examples for datasets
  - `id` (uuid, primary key)
  - `dataset_id` (uuid, references fine_tuning_datasets)
  - `conversation_metric_id` (uuid, references agent_conversation_metrics)
  - `messages` (jsonb) - Array of message objects in OpenAI format
  - `system_prompt` (text) - System prompt used
  - `quality_score` (decimal) - Quality score (0-1)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only manage their own fine-tuning resources
  - Track all fine-tuning operations in audit log

  ## Notes
  - OpenAI fine-tuning costs are based on tokens trained
  - Fine-tuned models have different pricing than base models
  - Jobs can take hours to complete depending on dataset size
*/

CREATE TABLE IF NOT EXISTS fine_tuning_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  source_type text NOT NULL DEFAULT 'conversations' CHECK (source_type IN ('conversations', 'manual', 'imported')),
  agent_ids uuid[] DEFAULT '{}',
  swarm_ids uuid[] DEFAULT '{}',
  date_range_start date,
  date_range_end date,
  filters jsonb DEFAULT '{}',
  total_examples integer DEFAULT 0,
  file_id text,
  file_size_bytes bigint DEFAULT 0,
  status text DEFAULT 'preparing' CHECK (status IN ('preparing', 'ready', 'uploaded', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fine_tuning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id uuid REFERENCES fine_tuning_datasets(id) ON DELETE SET NULL,
  name text NOT NULL,
  base_model text NOT NULL DEFAULT 'gpt-4o-mini-2024-07-18',
  hyperparameters jsonb DEFAULT '{"n_epochs": 3}',
  openai_job_id text,
  status text DEFAULT 'validating_files' CHECK (status IN ('validating_files', 'queued', 'running', 'succeeded', 'failed', 'cancelled')),
  trained_tokens bigint DEFAULT 0,
  epochs integer DEFAULT 0,
  estimated_cost_usd decimal(10, 4) DEFAULT 0.0000,
  actual_cost_usd decimal(10, 4) DEFAULT 0.0000,
  fine_tuned_model text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fine_tuned_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fine_tuning_job_id uuid REFERENCES fine_tuning_jobs(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  openai_model_id text NOT NULL,
  base_model text NOT NULL,
  is_active boolean DEFAULT true,
  total_usage_tokens bigint DEFAULT 0,
  total_usage_cost_usd decimal(10, 4) DEFAULT 0.0000,
  performance_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_fine_tuned_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  fine_tuned_model_id uuid NOT NULL REFERENCES fine_tuned_models(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, fine_tuned_model_id)
);

CREATE TABLE IF NOT EXISTS fine_tuning_training_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES fine_tuning_datasets(id) ON DELETE CASCADE,
  conversation_metric_id uuid REFERENCES agent_conversation_metrics(id) ON DELETE SET NULL,
  messages jsonb NOT NULL DEFAULT '[]',
  system_prompt text DEFAULT '',
  quality_score decimal(3, 2) DEFAULT 1.00,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fine_tuning_datasets_user ON fine_tuning_datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_datasets_status ON fine_tuning_datasets(status);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_user ON fine_tuning_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_status ON fine_tuning_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_openai_id ON fine_tuning_jobs(openai_job_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuned_models_user ON fine_tuned_models(user_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuned_models_active ON fine_tuned_models(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_fine_tuned_models_agent ON agent_fine_tuned_models(agent_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_examples_dataset ON fine_tuning_training_examples(dataset_id);

ALTER TABLE fine_tuning_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_tuning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_tuned_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_fine_tuned_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_tuning_training_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own datasets"
  ON fine_tuning_datasets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create datasets"
  ON fine_tuning_datasets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own datasets"
  ON fine_tuning_datasets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own datasets"
  ON fine_tuning_datasets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own jobs"
  ON fine_tuning_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create jobs"
  ON fine_tuning_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON fine_tuning_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON fine_tuning_jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own models"
  ON fine_tuned_models FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create models"
  ON fine_tuned_models FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own models"
  ON fine_tuned_models FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own models"
  ON fine_tuned_models FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view agent models for own agents"
  ON agent_fine_tuned_models FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_fine_tuned_models.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create agent models for own agents"
  ON agent_fine_tuned_models FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_fine_tuned_models.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agent models for own agents"
  ON agent_fine_tuned_models FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_fine_tuned_models.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete agent models for own agents"
  ON agent_fine_tuned_models FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_fine_tuned_models.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view training examples for own datasets"
  ON fine_tuning_training_examples FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fine_tuning_datasets
      WHERE fine_tuning_datasets.id = fine_tuning_training_examples.dataset_id
      AND fine_tuning_datasets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create training examples for own datasets"
  ON fine_tuning_training_examples FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fine_tuning_datasets
      WHERE fine_tuning_datasets.id = fine_tuning_training_examples.dataset_id
      AND fine_tuning_datasets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete training examples for own datasets"
  ON fine_tuning_training_examples FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fine_tuning_datasets
      WHERE fine_tuning_datasets.id = fine_tuning_training_examples.dataset_id
      AND fine_tuning_datasets.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_fine_tuning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fine_tuning_datasets_updated_at ON fine_tuning_datasets;
CREATE TRIGGER fine_tuning_datasets_updated_at
  BEFORE UPDATE ON fine_tuning_datasets
  FOR EACH ROW
  EXECUTE FUNCTION update_fine_tuning_updated_at();

DROP TRIGGER IF EXISTS fine_tuning_jobs_updated_at ON fine_tuning_jobs;
CREATE TRIGGER fine_tuning_jobs_updated_at
  BEFORE UPDATE ON fine_tuning_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_fine_tuning_updated_at();

DROP TRIGGER IF EXISTS fine_tuned_models_updated_at ON fine_tuned_models;
CREATE TRIGGER fine_tuned_models_updated_at
  BEFORE UPDATE ON fine_tuned_models
  FOR EACH ROW
  EXECUTE FUNCTION update_fine_tuning_updated_at();

CREATE OR REPLACE FUNCTION calculate_fine_tuning_cost(
  p_base_model text,
  p_total_tokens bigint,
  p_epochs integer DEFAULT 3
)
RETURNS decimal
LANGUAGE plpgsql
AS $$
DECLARE
  v_cost_per_million decimal;
  v_total_cost decimal;
BEGIN
  CASE p_base_model
    WHEN 'gpt-4o-2024-08-06' THEN
      v_cost_per_million := 25.00;
    WHEN 'gpt-4o-mini-2024-07-18' THEN
      v_cost_per_million := 3.00;
    WHEN 'gpt-3.5-turbo' THEN
      v_cost_per_million := 8.00;
    ELSE
      v_cost_per_million := 10.00;
  END CASE;
  
  v_total_cost := (p_total_tokens::decimal / 1000000) * v_cost_per_million * p_epochs;
  
  RETURN v_total_cost;
END;
$$;
