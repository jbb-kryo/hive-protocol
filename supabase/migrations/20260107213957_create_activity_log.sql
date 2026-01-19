/*
  # Create Activity Log System

  1. New Tables
    - `activity_log`
      - `id` (uuid, primary key) - Unique identifier for each activity
      - `user_id` (uuid, foreign key) - User who performed the action
      - `activity_type` (text) - Type of activity (swarm_created, agent_joined, message_sent, tool_spawned)
      - `title` (text) - Human-readable title of the activity
      - `description` (text, optional) - Additional details about the activity
      - `metadata` (jsonb, optional) - Flexible storage for activity-specific data
      - `created_at` (timestamptz) - When the activity occurred

  2. Security
    - Enable RLS on `activity_log` table
    - Users can read their own activities
    - Users can create their own activities
    - Activities cannot be updated or deleted to maintain audit trail

  3. Indexes
    - Index on user_id for faster queries
    - Index on created_at for sorting and pagination
    - Index on activity_type for filtering
*/

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('swarm_created', 'agent_joined', 'message_sent', 'tool_spawned', 'swarm_deleted', 'settings_updated')),
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own activities
CREATE POLICY "Users can read own activities"
  ON activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own activities
CREATE POLICY "Users can create own activities"
  ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type ON activity_log(activity_type);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON activity_log(user_id, created_at DESC);
