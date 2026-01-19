/*
  # Create Webhook Event Queue System

  1. New Tables
    - `webhook_events` - Queue of events waiting to be dispatched
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Owner of the resource that triggered the event
      - `event_type` (text) - Type of event (swarm.created, agent.updated, etc.)
      - `resource_type` (text) - Type of resource (swarm, agent, message, etc.)
      - `resource_id` (uuid) - ID of the affected resource
      - `payload` (jsonb) - Event data to send
      - `status` (text) - pending, processing, completed, failed
      - `attempt_count` (integer) - Number of delivery attempts
      - `max_attempts` (integer) - Maximum retry attempts
      - `next_attempt_at` (timestamptz) - When to attempt next delivery
      - `created_at` (timestamptz)
      - `processed_at` (timestamptz)

  2. Changes to `webhook_deliveries`
    - `attempt_number` (integer) - Which attempt this was
    - `event_id` (uuid) - Reference to webhook_events

  3. Security
    - Enable RLS on webhook_events
    - Users can only see their own events

  4. Indexes
    - Index on status and next_attempt_at for queue processing
    - Index on user_id for user queries
*/

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  event_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  next_attempt_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook events"
  ON public.webhook_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_deliveries' AND column_name = 'attempt_number'
  ) THEN
    ALTER TABLE public.webhook_deliveries ADD COLUMN attempt_number integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_deliveries' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE public.webhook_deliveries ADD COLUMN event_id uuid REFERENCES public.webhook_events ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhook_events_status_next_attempt 
  ON public.webhook_events(status, next_attempt_at) 
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id 
  ON public.webhook_events(user_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type 
  ON public.webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at 
  ON public.webhook_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_id 
  ON public.webhook_deliveries(event_id);

CREATE OR REPLACE FUNCTION public.queue_webhook_event(
  p_user_id uuid,
  p_event_type text,
  p_resource_type text,
  p_resource_id uuid,
  p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
  v_has_webhooks boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.webhooks
    WHERE user_id = p_user_id
      AND is_active = true
      AND p_event_type = ANY(events)
  ) INTO v_has_webhooks;

  IF NOT v_has_webhooks THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.webhook_events (
    user_id,
    event_type,
    resource_type,
    resource_id,
    payload
  ) VALUES (
    p_user_id,
    p_event_type,
    p_resource_type,
    p_resource_id,
    p_payload
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pending_webhook_events(p_limit integer DEFAULT 50)
RETURNS SETOF public.webhook_events
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM public.webhook_events
  WHERE status = 'pending'
    AND next_attempt_at <= now()
    AND attempt_count < max_attempts
  ORDER BY next_attempt_at ASC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.mark_webhook_event_processing(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.webhook_events
  SET status = 'processing',
      attempt_count = attempt_count + 1
  WHERE id = p_event_id
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_webhook_event_completed(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.webhook_events
  SET status = 'completed',
      processed_at = now()
  WHERE id = p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_webhook_event_failed(
  p_event_id uuid,
  p_retry boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_count integer;
  v_max_attempts integer;
  v_backoff_seconds integer;
BEGIN
  SELECT attempt_count, max_attempts
  INTO v_attempt_count, v_max_attempts
  FROM public.webhook_events
  WHERE id = p_event_id;

  v_backoff_seconds := POWER(2, v_attempt_count) * 60;

  IF p_retry AND v_attempt_count < v_max_attempts THEN
    UPDATE public.webhook_events
    SET status = 'pending',
        next_attempt_at = now() + (v_backoff_seconds || ' seconds')::interval
    WHERE id = p_event_id;
  ELSE
    UPDATE public.webhook_events
    SET status = 'failed',
        processed_at = now()
    WHERE id = p_event_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events(p_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.webhook_events
  WHERE status IN ('completed', 'failed')
    AND created_at < now() - (p_days || ' days')::interval;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
