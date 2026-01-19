/*
  # Agent Status Tracking System

  1. Changes to `agents` table
    - `status` (text) - Current agent status: online, busy, idle, offline
    - `last_activity_at` (timestamptz) - Last activity timestamp
    - `current_task` (text) - Description of current task if busy

  2. New Tables
    - `agent_presence` - Tracks real-time agent presence and activity
      - `id` (uuid, primary key)
      - `agent_id` (uuid, references agents)
      - `user_id` (uuid, references profiles)
      - `status` (text) - online, busy, idle, offline
      - `activity_type` (text) - thinking, typing, processing, idle
      - `swarm_id` (uuid) - Current swarm if active
      - `started_at` (timestamptz) - When this status started
      - `metadata` (jsonb) - Additional context

  3. Security
    - Enable RLS on agent_presence table
    - Users can only view/manage their own agents' presence

  4. Indexes
    - Index on agent_id for fast lookups
    - Index on user_id for filtering by user
    - Index on status for filtering active agents
*/

-- Add status fields to agents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN status text DEFAULT 'offline' NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN last_activity_at timestamptz DEFAULT now();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'current_task'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN current_task text;
  END IF;
END $$;

-- Create agent_presence table for real-time tracking
CREATE TABLE IF NOT EXISTS public.agent_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'offline' NOT NULL,
  activity_type text DEFAULT 'idle',
  swarm_id uuid REFERENCES public.swarms ON DELETE SET NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}' NOT NULL,
  UNIQUE(agent_id)
);

ALTER TABLE public.agent_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agents presence"
  ON public.agent_presence FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agents presence"
  ON public.agent_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents presence"
  ON public.agent_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents presence"
  ON public.agent_presence FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_presence_agent_id ON public.agent_presence(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_presence_user_id ON public.agent_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_presence_status ON public.agent_presence(status);
CREATE INDEX IF NOT EXISTS idx_agent_presence_swarm_id ON public.agent_presence(swarm_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_last_activity ON public.agents(last_activity_at);

-- Enable realtime for agent_presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_presence;
