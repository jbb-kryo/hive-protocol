/*
  # Create AI Models Management System

  1. New Tables
    - `ai_models` - AI model configurations
      - `id` (uuid, primary key)
      - `name` (text) - Display name
      - `provider` (text) - Provider name (openai, anthropic, etc.)
      - `model_id` (text) - Actual model identifier
      - `description` (text) - Model description
      - `capabilities` (jsonb) - Model capabilities
      - `context_window` (integer) - Max context length
      - `max_output_tokens` (integer) - Max output tokens
      - `input_cost_per_1k` (numeric) - Cost per 1k input tokens
      - `output_cost_per_1k` (numeric) - Cost per 1k output tokens
      - `is_active` (boolean) - Whether model is available
      - `is_default` (boolean) - Whether this is a default model
      - `settings` (jsonb) - Additional settings
      - `created_at`, `updated_at` (timestamptz)

    - `model_api_keys` - API keys for model providers
      - `id` (uuid, primary key)
      - `provider` (text) - Provider name
      - `key_name` (text) - Friendly name for the key
      - `encrypted_key` (text) - Encrypted API key
      - `is_active` (boolean)
      - `usage_count` (integer) - Track usage
      - `last_used_at` (timestamptz)
      - `created_at`, `updated_at` (timestamptz)

    - `plan_rate_limits` - Rate limits per subscription plan
      - `id` (uuid, primary key)
      - `plan` (text) - Plan name (free, pro, enterprise)
      - `model_id` (uuid) - Reference to ai_models
      - `requests_per_minute` (integer)
      - `requests_per_day` (integer)
      - `tokens_per_day` (integer)
      - `max_agents` (integer) - Max agents allowed
      - `max_swarms` (integer) - Max swarms allowed
      - `created_at`, `updated_at` (timestamptz)

    - `default_agents` - System-wide default agents
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text)
      - `framework` (text)
      - `model_id` (uuid) - Reference to ai_models
      - `system_prompt` (text)
      - `settings` (jsonb)
      - `is_active` (boolean)
      - `created_at`, `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Only admins can manage these tables (via edge functions)

  3. Seed Data
    - Add common AI models
    - Add default rate limits
*/

CREATE TABLE IF NOT EXISTS public.ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  model_id text NOT NULL,
  description text,
  capabilities jsonb DEFAULT '[]'::jsonb,
  context_window integer DEFAULT 4096,
  max_output_tokens integer DEFAULT 4096,
  input_cost_per_1k numeric(10, 6) DEFAULT 0,
  output_cost_per_1k numeric(10, 6) DEFAULT 0,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.model_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  key_name text NOT NULL,
  encrypted_key text NOT NULL,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL,
  model_id uuid REFERENCES public.ai_models(id) ON DELETE CASCADE,
  requests_per_minute integer DEFAULT 10,
  requests_per_day integer DEFAULT 100,
  tokens_per_day integer DEFAULT 100000,
  max_agents integer DEFAULT 5,
  max_swarms integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(plan, model_id)
);

CREATE TABLE IF NOT EXISTS public.default_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  framework text NOT NULL DEFAULT 'custom',
  model_id uuid REFERENCES public.ai_models(id) ON DELETE SET NULL,
  system_prompt text,
  settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.default_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_models"
  ON public.ai_models FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read active ai_models"
  ON public.ai_models FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage model_api_keys"
  ON public.model_api_keys FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage plan_rate_limits"
  ON public.plan_rate_limits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read plan_rate_limits"
  ON public.plan_rate_limits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage default_agents"
  ON public.default_agents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read active default_agents"
  ON public.default_agents FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON public.ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON public.ai_models(is_active);
CREATE INDEX IF NOT EXISTS idx_plan_rate_limits_plan ON public.plan_rate_limits(plan);
CREATE INDEX IF NOT EXISTS idx_default_agents_is_active ON public.default_agents(is_active);

INSERT INTO public.ai_models (name, provider, model_id, description, capabilities, context_window, max_output_tokens, input_cost_per_1k, output_cost_per_1k, is_default)
VALUES
  ('GPT-4o', 'openai', 'gpt-4o', 'Most capable GPT-4 model with vision capabilities', '["text", "vision", "function_calling"]'::jsonb, 128000, 4096, 0.005, 0.015, true),
  ('GPT-4o Mini', 'openai', 'gpt-4o-mini', 'Smaller, faster, and cheaper GPT-4 variant', '["text", "vision", "function_calling"]'::jsonb, 128000, 16384, 0.00015, 0.0006, false),
  ('GPT-3.5 Turbo', 'openai', 'gpt-3.5-turbo', 'Fast and cost-effective for simpler tasks', '["text", "function_calling"]'::jsonb, 16385, 4096, 0.0005, 0.0015, false),
  ('Claude 3.5 Sonnet', 'anthropic', 'claude-3-5-sonnet-20241022', 'Anthropic''s most intelligent model', '["text", "vision", "function_calling"]'::jsonb, 200000, 8192, 0.003, 0.015, true),
  ('Claude 3 Haiku', 'anthropic', 'claude-3-haiku-20240307', 'Fast and compact Claude model', '["text", "vision"]'::jsonb, 200000, 4096, 0.00025, 0.00125, false),
  ('Gemini 1.5 Pro', 'google', 'gemini-1.5-pro', 'Google''s advanced multimodal model', '["text", "vision", "audio"]'::jsonb, 1000000, 8192, 0.00125, 0.005, false),
  ('Gemini 1.5 Flash', 'google', 'gemini-1.5-flash', 'Fast and versatile Gemini model', '["text", "vision", "audio"]'::jsonb, 1000000, 8192, 0.000075, 0.0003, false)
ON CONFLICT DO NOTHING;

INSERT INTO public.plan_rate_limits (plan, requests_per_minute, requests_per_day, tokens_per_day, max_agents, max_swarms)
SELECT 'free', 5, 50, 50000, 3, 2
WHERE NOT EXISTS (SELECT 1 FROM public.plan_rate_limits WHERE plan = 'free' AND model_id IS NULL);

INSERT INTO public.plan_rate_limits (plan, requests_per_minute, requests_per_day, tokens_per_day, max_agents, max_swarms)
SELECT 'pro', 30, 500, 500000, 20, 10
WHERE NOT EXISTS (SELECT 1 FROM public.plan_rate_limits WHERE plan = 'pro' AND model_id IS NULL);

INSERT INTO public.plan_rate_limits (plan, requests_per_minute, requests_per_day, tokens_per_day, max_agents, max_swarms)
SELECT 'enterprise', 100, 5000, 5000000, 100, 50
WHERE NOT EXISTS (SELECT 1 FROM public.plan_rate_limits WHERE plan = 'enterprise' AND model_id IS NULL);

INSERT INTO public.default_agents (name, role, framework, system_prompt, settings, sort_order)
VALUES
  ('Research Assistant', 'researcher', 'langchain', 'You are a helpful research assistant. Analyze information, find patterns, and provide comprehensive summaries. Always cite sources when possible.', '{"temperature": 0.7}'::jsonb, 1),
  ('Code Helper', 'developer', 'autogen', 'You are an expert software developer. Help with coding tasks, debug issues, explain code, and suggest best practices. Be concise and provide working code examples.', '{"temperature": 0.3}'::jsonb, 2),
  ('Creative Writer', 'writer', 'crewai', 'You are a creative writer with expertise in various styles and formats. Help with content creation, storytelling, and copywriting. Be creative while maintaining the user''s voice.', '{"temperature": 0.9}'::jsonb, 3),
  ('Data Analyst', 'analyst', 'custom', 'You are a data analyst skilled in interpreting data, creating visualizations, and deriving insights. Explain findings clearly and suggest actionable recommendations.', '{"temperature": 0.5}'::jsonb, 4)
ON CONFLICT DO NOTHING;