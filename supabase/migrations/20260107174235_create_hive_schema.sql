/*
  # HIVE Protocol Database Schema

  1. New Tables
    - `profiles` - User profiles extending auth.users
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `plan` (text, default 'free')
      - `onboarding_complete` (boolean, default false)
      - `role` (text, default 'user')
      - `created_at` (timestamptz)
    
    - `agents` - AI agent configurations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `role` (text)
      - `framework` (text) - anthropic, openai, huggingface, local
      - `model` (text)
      - `system_prompt` (text)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
    
    - `swarms` - Multi-agent collaboration sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `task` (text)
      - `status` (text) - active, paused, completed
      - `settings` (jsonb)
      - `created_at` (timestamptz)
    
    - `swarm_agents` - Junction table for swarm-agent relationships
      - `swarm_id` (uuid, references swarms)
      - `agent_id` (uuid, references agents)
      - `joined_at` (timestamptz)
    
    - `messages` - Swarm communication history
      - `id` (uuid, primary key)
      - `swarm_id` (uuid, references swarms)
      - `sender_id` (uuid)
      - `sender_type` (text) - agent, human, system
      - `content` (text)
      - `reasoning` (text)
      - `signature` (text)
      - `verified` (boolean)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
    
    - `integrations` - User API integrations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `provider` (text)
      - `credentials` (jsonb, encrypted)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
    
    - `context_blocks` - Shared swarm context
      - `id` (uuid, primary key)
      - `swarm_id` (uuid, references swarms)
      - `name` (text)
      - `content` (text)
      - `priority` (text)
      - `shared` (boolean)
      - `created_by` (uuid)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Admin users can access all data
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  plan text DEFAULT 'free' NOT NULL,
  onboarding_complete boolean DEFAULT false NOT NULL,
  role text DEFAULT 'user' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text,
  framework text NOT NULL,
  model text,
  system_prompt text,
  settings jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agents"
  ON public.agents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agents"
  ON public.agents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents"
  ON public.agents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents"
  ON public.agents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Swarms table
CREATE TABLE IF NOT EXISTS public.swarms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  task text,
  status text DEFAULT 'active' NOT NULL,
  settings jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.swarms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swarms"
  ON public.swarms FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swarms"
  ON public.swarms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own swarms"
  ON public.swarms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own swarms"
  ON public.swarms FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Swarm Agents junction table
CREATE TABLE IF NOT EXISTS public.swarm_agents (
  swarm_id uuid REFERENCES public.swarms ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES public.agents ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (swarm_id, agent_id)
);

ALTER TABLE public.swarm_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swarm agents"
  ON public.swarm_agents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = swarm_agents.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own swarm agents"
  ON public.swarm_agents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = swarm_agents.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own swarm agents"
  ON public.swarm_agents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = swarm_agents.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id uuid REFERENCES public.swarms ON DELETE CASCADE NOT NULL,
  sender_id uuid,
  sender_type text NOT NULL,
  content text NOT NULL,
  reasoning text,
  signature text,
  verified boolean DEFAULT false NOT NULL,
  metadata jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swarm messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = messages.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own swarms"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = messages.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

-- Integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  credentials jsonb NOT NULL,
  settings jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, provider)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON public.integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON public.integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON public.integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON public.integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Context Blocks table
CREATE TABLE IF NOT EXISTS public.context_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id uuid REFERENCES public.swarms ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'medium' NOT NULL,
  shared boolean DEFAULT true NOT NULL,
  created_by uuid REFERENCES public.agents ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.context_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swarm context"
  ON public.context_blocks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = context_blocks.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert context to own swarms"
  ON public.context_blocks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = context_blocks.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update context in own swarms"
  ON public.context_blocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = context_blocks.swarm_id
      AND swarms.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = context_blocks.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete context from own swarms"
  ON public.context_blocks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = context_blocks.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_swarms_user_id ON public.swarms(user_id);
CREATE INDEX IF NOT EXISTS idx_swarms_status ON public.swarms(status);
CREATE INDEX IF NOT EXISTS idx_messages_swarm_id ON public.messages(swarm_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_context_blocks_swarm_id ON public.context_blocks(swarm_id);

-- Enable realtime for messages and swarms
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.swarms;