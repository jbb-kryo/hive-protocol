/*
  # Two-Factor Authentication Support

  1. New Columns on `profiles`
    - `totp_secret` (text) - Encrypted TOTP secret key for authenticator apps
    - `totp_enabled` (boolean) - Whether 2FA is currently enabled
    - `backup_codes` (text[]) - Array of hashed backup codes for account recovery
    - `totp_verified_at` (timestamptz) - When 2FA was successfully enabled

  2. Security
    - totp_secret is stored encrypted and only accessible by the user
    - backup_codes are hashed before storage
    - Service role required for TOTP operations (via edge functions)

  3. Notes
    - Users must verify TOTP before it becomes enabled
    - Backup codes should be regenerated when used or on request
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'totp_secret'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN totp_secret text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'totp_enabled'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN totp_enabled boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'backup_codes'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN backup_codes text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'totp_verified_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN totp_verified_at timestamptz;
  END IF;
END $$;
