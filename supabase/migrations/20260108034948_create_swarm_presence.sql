/*
  # Swarm User Presence System

  1. New Tables
    - `swarm_presence` - Tracks which users are currently viewing a swarm
      - `id` (uuid, primary key)
      - `swarm_id` (uuid, references swarms)
      - `user_id` (uuid, references profiles)
      - `joined_at` (timestamptz) - When user started viewing
      - `last_seen_at` (timestamptz) - Last activity timestamp
      - `is_active` (boolean) - Whether tab is focused
      - `cursor_position` (jsonb) - Optional cursor position for collaboration

  2. Security
    - Enable RLS on swarm_presence table
    - Users can view presence for swarms they have access to
    - Users can only manage their own presence records

  3. Indexes
    - Index on swarm_id for fast lookups
    - Index on user_id for filtering
    - Index on last_seen_at for cleanup queries

  4. Notes
    - Presence records should be cleaned up when stale (no activity for 5+ minutes)
    - Real-time subscriptions will update presence in UI
*/

CREATE TABLE IF NOT EXISTS public.swarm_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id uuid REFERENCES public.swarms ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  last_seen_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  cursor_position jsonb DEFAULT '{}',
  UNIQUE(swarm_id, user_id)
);

ALTER TABLE public.swarm_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presence in accessible swarms"
  ON public.swarm_presence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swarms s
      WHERE s.id = swarm_presence.swarm_id
      AND (
        s.user_id = auth.uid()
        OR s.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM public.swarm_shares ss
          WHERE ss.swarm_id = s.id
          AND ss.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert own presence"
  ON public.swarm_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
  ON public.swarm_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presence"
  ON public.swarm_presence FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_swarm_presence_swarm_id ON public.swarm_presence(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_presence_user_id ON public.swarm_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_swarm_presence_last_seen ON public.swarm_presence(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_swarm_presence_active ON public.swarm_presence(swarm_id, is_active) WHERE is_active = true;

ALTER PUBLICATION supabase_realtime ADD TABLE public.swarm_presence;
