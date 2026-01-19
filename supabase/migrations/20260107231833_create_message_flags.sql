/*
  # Create Message Flags Table

  1. New Tables
    - `message_flags` - Stores flagged messages for review
      - `id` (uuid, primary key)
      - `message_id` (uuid, references messages)
      - `swarm_id` (uuid, references swarms)
      - `flagged_by` (uuid, references profiles)
      - `reason` (text) - The reason category for flagging
      - `details` (text) - Additional context from the user
      - `status` (text) - pending, reviewed, dismissed
      - `reviewed_by` (uuid, references profiles)
      - `reviewed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `message_flags` table
    - Users can create flags for messages in swarms they have access to
    - Users can view their own flags
    - Admins can view and update all flags
*/

CREATE TABLE IF NOT EXISTS public.message_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  swarm_id uuid NOT NULL REFERENCES public.swarms(id) ON DELETE CASCADE,
  flagged_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending' NOT NULL,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.message_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create flags for messages in their swarms"
  ON public.message_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.swarms
      WHERE swarms.id = message_flags.swarm_id
      AND (
        swarms.user_id = auth.uid()
        OR swarms.visibility = 'public'
      )
    )
  );

CREATE POLICY "Users can view their own flags"
  ON public.message_flags FOR SELECT
  TO authenticated
  USING (flagged_by = auth.uid());

CREATE POLICY "Admins can view all flags"
  ON public.message_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update flags"
  ON public.message_flags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_message_flags_message_id ON public.message_flags(message_id);
CREATE INDEX IF NOT EXISTS idx_message_flags_swarm_id ON public.message_flags(swarm_id);
CREATE INDEX IF NOT EXISTS idx_message_flags_status ON public.message_flags(status);
