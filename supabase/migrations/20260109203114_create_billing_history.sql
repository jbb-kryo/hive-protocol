/*
  # Billing History System

  1. New Tables
    - `billing_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `stripe_invoice_id` (text, unique)
      - `stripe_payment_intent_id` (text)
      - `amount` (integer, in cents)
      - `currency` (text, default 'usd')
      - `status` (text: paid, pending, failed, refunded)
      - `description` (text)
      - `invoice_pdf` (text, URL)
      - `hosted_invoice_url` (text, URL)
      - `period_start` (timestamptz)
      - `period_end` (timestamptz)
      - `created_at` (timestamptz)

  2. Modifications
    - Add trial_ends_at to stripe_subscriptions for free trial handling

  3. Security
    - Enable RLS on billing_history
    - Users can only view their own billing history
*/

CREATE TABLE IF NOT EXISTS billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id text UNIQUE,
  stripe_payment_intent_id text,
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'failed', 'refunded', 'void')),
  description text,
  invoice_pdf text,
  hosted_invoice_url text,
  period_start timestamptz,
  period_end timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN trial_ends_at bigint;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN plan_name text DEFAULT 'free';
  END IF;
END $$;

ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing history"
  ON billing_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_created_at ON billing_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(customer_id);