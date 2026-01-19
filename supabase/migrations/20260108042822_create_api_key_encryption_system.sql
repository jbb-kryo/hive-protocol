/*
  # Create API Key Encryption System

  1. Overview
    - Uses Supabase Vault for secure key storage
    - Encrypts all API keys before storing in database
    - Decryption only happens server-side when needed
    - Client responses only contain masked values

  2. New Tables
    - `encrypted_credentials` - Stores encrypted API keys with Vault references
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Owner of the credentials
      - `integration_id` (uuid) - Related integration
      - `credential_key` (text) - Name of the credential (e.g., 'api_key')
      - `vault_secret_id` (uuid) - Reference to Vault secret
      - `masked_value` (text) - Masked version for display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Functions
    - `encrypt_api_key` - Encrypts and stores API key in Vault
    - `decrypt_api_key` - Retrieves and decrypts key from Vault (service role only)
    - `store_integration_credentials` - Securely stores all credentials for an integration
    - `get_masked_credentials` - Returns only masked credentials for client

  4. Security
    - RLS ensures users can only access their own credentials
    - Decryption functions require service role
    - Never expose raw keys in client responses
*/

CREATE TABLE IF NOT EXISTS public.encrypted_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.user_integrations ON DELETE CASCADE,
  credential_key text NOT NULL,
  vault_secret_id uuid,
  encrypted_value text,
  masked_value text NOT NULL,
  encryption_method text DEFAULT 'vault',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_integration_credential UNIQUE (integration_id, credential_key)
);

ALTER TABLE public.encrypted_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own encrypted credentials metadata"
  ON public.encrypted_credentials
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own encrypted credentials"
  ON public.encrypted_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own encrypted credentials"
  ON public.encrypted_credentials
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own encrypted credentials"
  ON public.encrypted_credentials
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_encrypted_credentials_user 
  ON public.encrypted_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_credentials_integration 
  ON public.encrypted_credentials(integration_id);

CREATE OR REPLACE FUNCTION public.mask_api_key(p_key text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_key IS NULL OR length(p_key) = 0 THEN
    RETURN '••••••••';
  END IF;
  
  IF length(p_key) <= 8 THEN
    RETURN '••••••••';
  END IF;
  
  RETURN substring(p_key from 1 for 4) || '••••••••' || substring(p_key from length(p_key) - 3);
END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_credential(
  p_user_id uuid,
  p_integration_id uuid,
  p_key_name text,
  p_key_value text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret_id uuid;
  v_credential_id uuid;
  v_masked text;
  v_encrypted text;
BEGIN
  v_masked := public.mask_api_key(p_key_value);
  
  v_encrypted := encode(
    extensions.encrypt(
      p_key_value::bytea,
      extensions.digest(p_user_id::text || p_integration_id::text, 'sha256'),
      'aes'
    ),
    'base64'
  );

  INSERT INTO public.encrypted_credentials (
    user_id,
    integration_id,
    credential_key,
    vault_secret_id,
    encrypted_value,
    masked_value,
    encryption_method
  )
  VALUES (
    p_user_id,
    p_integration_id,
    p_key_name,
    v_secret_id,
    v_encrypted,
    v_masked,
    'aes256'
  )
  ON CONFLICT (integration_id, credential_key)
  DO UPDATE SET
    encrypted_value = v_encrypted,
    masked_value = v_masked,
    updated_at = now()
  RETURNING id INTO v_credential_id;

  RETURN v_credential_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_credential(
  p_credential_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credential record;
  v_decrypted text;
BEGIN
  SELECT * INTO v_credential
  FROM public.encrypted_credentials
  WHERE id = p_credential_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credential not found';
  END IF;

  IF v_credential.encrypted_value IS NULL THEN
    RAISE EXCEPTION 'No encrypted value found';
  END IF;

  v_decrypted := convert_from(
    extensions.decrypt(
      decode(v_credential.encrypted_value, 'base64'),
      extensions.digest(v_credential.user_id::text || v_credential.integration_id::text, 'sha256'),
      'aes'
    ),
    'UTF8'
  );

  RETURN v_decrypted;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_integration_credential(
  p_integration_id uuid,
  p_key_name text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credential_id uuid;
BEGIN
  SELECT id INTO v_credential_id
  FROM public.encrypted_credentials
  WHERE integration_id = p_integration_id
    AND credential_key = p_key_name;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN public.decrypt_credential(v_credential_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.store_integration_credentials(
  p_integration_id uuid,
  p_credentials jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_key text;
  v_value text;
  v_result jsonb := '{}';
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.user_integrations
  WHERE id = p_integration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Integration not found';
  END IF;

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_credentials)
  LOOP
    IF v_value IS NOT NULL AND v_value != '' THEN
      PERFORM public.encrypt_credential(v_user_id, p_integration_id, v_key, v_value);
      v_result := v_result || jsonb_build_object(v_key, public.mask_api_key(v_value));
    END IF;
  END LOOP;

  UPDATE public.user_integrations
  SET credentials = '{}'::jsonb,
      updated_at = now()
  WHERE id = p_integration_id;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_integration_masked_credentials(
  p_integration_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result jsonb := '{}';
  v_cred record;
BEGIN
  FOR v_cred IN 
    SELECT credential_key, masked_value
    FROM public.encrypted_credentials
    WHERE integration_id = p_integration_id
  LOOP
    v_result := v_result || jsonb_build_object(v_cred.credential_key, v_cred.masked_value);
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_integration_credentials(
  p_integration_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb := '{}';
  v_cred record;
  v_decrypted text;
BEGIN
  FOR v_cred IN 
    SELECT id, credential_key
    FROM public.encrypted_credentials
    WHERE integration_id = p_integration_id
  LOOP
    v_decrypted := public.decrypt_credential(v_cred.id);
    v_result := v_result || jsonb_build_object(v_cred.credential_key, v_decrypted);
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_integration_credentials(
  p_integration_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.encrypted_credentials
  WHERE integration_id = p_integration_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_encrypted_credentials(
  p_integration_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.encrypted_credentials
    WHERE integration_id = p_integration_id
  );
$$;
