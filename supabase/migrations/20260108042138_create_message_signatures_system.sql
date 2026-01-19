/*
  # Create Message Signatures System

  1. New Tables
    - `signing_keys` - Stores cryptographic keys for message signing
      - `id` (uuid, primary key)
      - `agent_id` (uuid) - The agent this key belongs to
      - `public_key` (text) - Public key for verification
      - `key_algorithm` (text) - Algorithm used (HMAC-SHA256)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz) - Optional expiration
      - `is_active` (boolean) - Whether key is currently active

  2. Changes to `messages`
    - Add `signature_status` column for verification status
    - Add `signed_at` column for when message was signed
    - Add `verification_error` column for error messages

  3. Functions
    - `generate_message_signature` - Creates HMAC signature for message
    - `verify_message_signature` - Verifies message signature
    - `get_signing_key_for_agent` - Gets active signing key for agent
    - `trigger_sign_agent_message` - Auto-signs agent messages on insert

  4. Security
    - Enable RLS on signing_keys
    - Users can only view keys for their own agents
*/

CREATE TABLE IF NOT EXISTS public.signing_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents ON DELETE CASCADE,
  public_key text NOT NULL,
  key_algorithm text NOT NULL DEFAULT 'HMAC-SHA256',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  CONSTRAINT unique_active_key_per_agent UNIQUE (agent_id, is_active) 
    DEFERRABLE INITIALLY DEFERRED
);

ALTER TABLE public.signing_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signing keys for own agents"
  ON public.signing_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = signing_keys.agent_id
        AND agents.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_signing_keys_agent 
  ON public.signing_keys(agent_id) WHERE is_active = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'signature_status'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN signature_status text DEFAULT 'unsigned';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'signed_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN signed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'verification_error'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN verification_error text;
  END IF;
END $$;

ALTER TABLE public.messages 
  DROP CONSTRAINT IF EXISTS valid_signature_status;
ALTER TABLE public.messages 
  ADD CONSTRAINT valid_signature_status 
  CHECK (signature_status IN ('unsigned', 'signed', 'verified', 'invalid', 'tampered'));

CREATE OR REPLACE FUNCTION public.get_or_create_signing_key(p_agent_id uuid)
RETURNS public.signing_keys
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key public.signing_keys;
  v_new_key text;
BEGIN
  SELECT * INTO v_key
  FROM public.signing_keys
  WHERE agent_id = p_agent_id AND is_active = true
  LIMIT 1;

  IF FOUND THEN
    RETURN v_key;
  END IF;

  v_new_key := encode(extensions.gen_random_bytes(32), 'hex');

  INSERT INTO public.signing_keys (agent_id, public_key, key_algorithm)
  VALUES (p_agent_id, v_new_key, 'HMAC-SHA256')
  RETURNING * INTO v_key;

  RETURN v_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_message_signature(
  p_message_id uuid,
  p_content text,
  p_sender_id uuid,
  p_swarm_id uuid,
  p_created_at timestamptz
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key public.signing_keys;
  v_payload text;
  v_signature text;
BEGIN
  v_key := public.get_or_create_signing_key(p_sender_id);
  
  v_payload := p_message_id::text || '|' || 
               p_content || '|' || 
               p_sender_id::text || '|' || 
               p_swarm_id::text || '|' || 
               extract(epoch from p_created_at)::text;

  v_signature := encode(
    extensions.hmac(
      v_payload::bytea,
      decode(v_key.public_key, 'hex'),
      'sha256'
    ),
    'hex'
  );

  RETURN v_signature;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_message_signature(p_message_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message record;
  v_expected_signature text;
  v_result jsonb;
BEGIN
  SELECT * INTO v_message
  FROM public.messages
  WHERE id = p_message_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'invalid',
      'error', 'Message not found'
    );
  END IF;

  IF v_message.sender_type != 'agent' OR v_message.sender_id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', true,
      'status', 'unsigned',
      'error', null
    );
  END IF;

  IF v_message.signature IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'unsigned',
      'error', 'Message has no signature'
    );
  END IF;

  v_expected_signature := public.generate_message_signature(
    v_message.id,
    v_message.content,
    v_message.sender_id,
    v_message.swarm_id,
    v_message.created_at
  );

  IF v_message.signature = v_expected_signature THEN
    UPDATE public.messages
    SET verified = true,
        signature_status = 'verified',
        verification_error = null
    WHERE id = p_message_id;

    RETURN jsonb_build_object(
      'valid', true,
      'status', 'verified',
      'error', null
    );
  ELSE
    UPDATE public.messages
    SET verified = false,
        signature_status = 'tampered',
        verification_error = 'Signature mismatch - message may have been tampered'
    WHERE id = p_message_id;

    RETURN jsonb_build_object(
      'valid', false,
      'status', 'tampered',
      'error', 'Signature mismatch - message may have been tampered'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sign_message(p_message_id uuid)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message public.messages;
  v_signature text;
BEGIN
  SELECT * INTO v_message
  FROM public.messages
  WHERE id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  IF v_message.sender_type != 'agent' OR v_message.sender_id IS NULL THEN
    RETURN v_message;
  END IF;

  v_signature := public.generate_message_signature(
    v_message.id,
    v_message.content,
    v_message.sender_id,
    v_message.swarm_id,
    v_message.created_at
  );

  UPDATE public.messages
  SET signature = v_signature,
      signature_status = 'signed',
      signed_at = now(),
      verified = true
  WHERE id = p_message_id
  RETURNING * INTO v_message;

  RETURN v_message;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_sign_agent_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signature text;
BEGIN
  IF NEW.sender_type = 'agent' AND NEW.sender_id IS NOT NULL THEN
    v_signature := public.generate_message_signature(
      NEW.id,
      NEW.content,
      NEW.sender_id,
      NEW.swarm_id,
      NEW.created_at
    );

    NEW.signature := v_signature;
    NEW.signature_status := 'signed';
    NEW.signed_at := now();
    NEW.verified := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_sign_agent_messages ON public.messages;
CREATE TRIGGER auto_sign_agent_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sign_agent_message();

CREATE OR REPLACE FUNCTION public.batch_verify_messages(p_message_ids uuid[])
RETURNS TABLE(
  message_id uuid,
  valid boolean,
  status text,
  error text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_msg_id uuid;
  v_result jsonb;
BEGIN
  FOREACH v_msg_id IN ARRAY p_message_ids
  LOOP
    v_result := public.verify_message_signature(v_msg_id);
    
    message_id := v_msg_id;
    valid := (v_result->>'valid')::boolean;
    status := v_result->>'status';
    error := v_result->>'error';
    RETURN NEXT;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_message_verification_status(p_message_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'message_id', m.id,
    'has_signature', m.signature IS NOT NULL,
    'signature_status', m.signature_status,
    'verified', m.verified,
    'signed_at', m.signed_at,
    'verification_error', m.verification_error,
    'sender_type', m.sender_type,
    'can_verify', m.sender_type = 'agent' AND m.sender_id IS NOT NULL
  )
  FROM public.messages m
  WHERE m.id = p_message_id;
$$;
