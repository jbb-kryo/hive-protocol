/*
  # Add Swarm Sharing Functionality

  1. Changes to existing tables
    - `swarms` table additions:
      - `visibility` (text) - 'private' or 'public'
      - `share_token` (text) - unique token for shareable links
      - `allow_guest_messages` (boolean) - whether viewers can send messages

  2. New Tables
    - `swarm_shares` - Track access to shared swarms
      - `id` (uuid, primary key)
      - `swarm_id` (uuid, references swarms)
      - `shared_with_user_id` (uuid, references profiles, nullable)
      - `access_level` (text) - 'view' or 'edit'
      - `created_at` (timestamptz)
      - `accessed_at` (timestamptz)

  3. Security
    - Enable RLS on swarm_shares table
    - Update swarms RLS policies to allow shared access
    - Allow public access to swarms with public visibility and valid share token
*/

-- Add sharing columns to swarms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'swarms' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE public.swarms ADD COLUMN visibility text DEFAULT 'private' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'swarms' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE public.swarms ADD COLUMN share_token text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'swarms' AND column_name = 'allow_guest_messages'
  ) THEN
    ALTER TABLE public.swarms ADD COLUMN allow_guest_messages boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create unique index on share_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_swarms_share_token ON public.swarms(share_token) WHERE share_token IS NOT NULL;

-- Create swarm_shares table
CREATE TABLE IF NOT EXISTS public.swarm_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id uuid REFERENCES public.swarms ON DELETE CASCADE NOT NULL,
  shared_with_user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
  access_level text DEFAULT 'view' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  accessed_at timestamptz
);

ALTER TABLE public.swarm_shares ENABLE ROW LEVEL SECURITY;

-- Swarm owners can view shares of their swarms
CREATE POLICY "Swarm owners can view shares"
  ON public.swarm_shares FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = swarm_shares.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

-- Swarm owners can create shares
CREATE POLICY "Swarm owners can create shares"
  ON public.swarm_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = swarm_shares.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

-- Swarm owners can delete shares
CREATE POLICY "Swarm owners can delete shares"
  ON public.swarm_shares FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = swarm_shares.swarm_id
      AND swarms.user_id = auth.uid()
    )
  );

-- Users can view shares they have access to
CREATE POLICY "Users can view their shares"
  ON public.swarm_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_with_user_id);

-- Update swarms policies to allow shared access
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own swarms" ON public.swarms;
DROP POLICY IF EXISTS "Users can view own swarm messages" ON public.messages;

-- Recreate swarms view policy with sharing support
CREATE POLICY "Users can view own and shared swarms"
  ON public.swarms FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.swarm_shares
      WHERE swarm_shares.swarm_id = swarms.id
      AND swarm_shares.shared_with_user_id = auth.uid()
    )
  );

-- Allow public access to swarms with valid share token
CREATE POLICY "Public can view swarms with valid share token"
  ON public.swarms FOR SELECT
  TO anon
  USING (visibility = 'public' AND share_token IS NOT NULL);

-- Update messages policy to allow viewing shared swarm messages
CREATE POLICY "Users can view own and shared swarm messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = messages.swarm_id
      AND (
        swarms.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.swarm_shares
          WHERE swarm_shares.swarm_id = swarms.id
          AND swarm_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

-- Allow public viewing of messages in public swarms
CREATE POLICY "Public can view messages in public swarms"
  ON public.messages FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = messages.swarm_id
      AND swarms.visibility = 'public'
      AND swarms.share_token IS NOT NULL
    )
  );

-- Allow guest messages if enabled (authenticated users only)
CREATE POLICY "Guests can send messages if allowed"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = messages.swarm_id
      AND swarms.allow_guest_messages = true
      AND (
        swarms.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.swarm_shares
          WHERE swarm_shares.swarm_id = swarms.id
          AND swarm_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

-- Update swarm_agents policy to allow viewing agents in shared swarms
DROP POLICY IF EXISTS "Users can view own swarm agents" ON public.swarm_agents;

CREATE POLICY "Users can view own and shared swarm agents"
  ON public.swarm_agents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = swarm_agents.swarm_id
      AND (
        swarms.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.swarm_shares
          WHERE swarm_shares.swarm_id = swarms.id
          AND swarm_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

-- Allow public viewing of swarm agents in public swarms
CREATE POLICY "Public can view agents in public swarms"
  ON public.swarm_agents FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = swarm_agents.swarm_id
      AND swarms.visibility = 'public'
      AND swarms.share_token IS NOT NULL
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_swarm_shares_swarm_id ON public.swarm_shares(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_shares_user_id ON public.swarm_shares(shared_with_user_id);

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text AS $$
DECLARE
  new_token text;
  token_exists boolean;
BEGIN
  LOOP
    new_token := encode(gen_random_bytes(16), 'base64');
    new_token := replace(replace(replace(new_token, '/', '_'), '+', '-'), '=', '');
    
    SELECT EXISTS(SELECT 1 FROM public.swarms WHERE share_token = new_token) INTO token_exists;
    
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;