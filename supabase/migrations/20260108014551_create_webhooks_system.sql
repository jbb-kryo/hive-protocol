/*
  # Create Webhooks System

  1. New Tables
    - `webhooks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - friendly name for the webhook
      - `url` (text) - endpoint URL to send events to
      - `secret` (text) - secret for signing payloads
      - `events` (text array) - list of events to trigger on
      - `is_active` (boolean) - enable/disable webhook
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `webhook_deliveries`
      - `id` (uuid, primary key)
      - `webhook_id` (uuid, references webhooks)
      - `event_type` (text) - the event that triggered this delivery
      - `payload` (jsonb) - the payload sent
      - `response_status` (integer) - HTTP response status
      - `response_body` (text) - response body (truncated)
      - `duration_ms` (integer) - request duration in milliseconds
      - `success` (boolean) - whether delivery succeeded
      - `error_message` (text) - error message if failed
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only manage their own webhooks
    - Users can only view deliveries for their own webhooks

  3. Indexes
    - Index on webhooks.user_id for fast lookups
    - Index on webhook_deliveries.webhook_id for history queries
    - Index on webhook_deliveries.created_at for recent deliveries
*/

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  response_status integer,
  response_body text,
  duration_ms integer,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Webhooks policies
CREATE POLICY "Users can view own webhooks"
  ON webhooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own webhooks"
  ON webhooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks"
  ON webhooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks"
  ON webhooks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Webhook deliveries policies
CREATE POLICY "Users can view deliveries for own webhooks"
  ON webhook_deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM webhooks
      WHERE webhooks.id = webhook_deliveries.webhook_id
      AND webhooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert deliveries for own webhooks"
  ON webhook_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM webhooks
      WHERE webhooks.id = webhook_deliveries.webhook_id
      AND webhooks.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);

-- Update trigger for webhooks
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhooks_updated_at ON webhooks;
CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();