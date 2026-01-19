/*
  # Add document_type to tos_versions

  1. Changes
    - Add `document_type` column to tos_versions table
    - Drop unique constraint on version alone
    - Add unique constraint on (version, document_type)
    - Insert initial ToS and Privacy Policy versions

  2. Notes
    - document_type can be 'tos' or 'privacy'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tos_versions' AND column_name = 'document_type'
  ) THEN
    ALTER TABLE public.tos_versions ADD COLUMN document_type text NOT NULL DEFAULT 'tos';
  END IF;
END $$;

ALTER TABLE public.tos_versions DROP CONSTRAINT IF EXISTS tos_versions_version_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tos_versions_version_document_type_key'
  ) THEN
    ALTER TABLE public.tos_versions ADD CONSTRAINT tos_versions_version_document_type_key UNIQUE (version, document_type);
  END IF;
END $$;

INSERT INTO public.tos_versions (version, effective_date, summary, requires_reacceptance, document_type)
VALUES 
  ('2026-01-01', '2026-01-01', 'Initial Terms of Service', false, 'tos'),
  ('2026-01-01', '2026-01-01', 'Initial Privacy Policy', false, 'privacy')
ON CONFLICT (version, document_type) DO NOTHING;
