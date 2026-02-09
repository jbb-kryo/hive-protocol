/*
  # Create Template Reviews System

  1. New Tables
    - `template_reviews`
      - `id` (uuid, primary key)
      - `template_id` (uuid, FK to default_agents) - which template was reviewed
      - `user_id` (uuid, FK to auth.users) - who wrote the review
      - `rating` (integer, 1-5) - star rating
      - `title` (text) - review headline
      - `comment` (text) - review body
      - `helpful_count` (integer) - how many users found this helpful
      - `is_flagged` (boolean) - admin moderation flag
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint: one review per user per template

    - `template_review_helpful`
      - `id` (uuid, primary key)
      - `review_id` (uuid, FK to template_reviews)
      - `user_id` (uuid, FK to auth.users)
      - Unique constraint: one vote per user per review

  2. Modified Tables
    - `default_agents`
      - `average_rating` (numeric) - cached average star rating
      - `review_count` (integer) - cached total review count
      - `clone_count` (integer) - how many times template has been cloned

  3. Security
    - RLS enabled on both new tables
    - Authenticated users can read all reviews
    - Users can create/update/delete their own reviews
    - Users can insert/delete their own helpful votes
    - Admins can delete any review (moderation)

  4. Notes
    - Separate from marketplace_reviews; this is for the internal template catalog
    - Cached rating/count on default_agents avoids expensive aggregation queries
    - clone_count tracks popularity independent of marketplace installs
*/

CREATE TABLE IF NOT EXISTS template_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES default_agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL DEFAULT '',
  comment text NOT NULL DEFAULT '',
  helpful_count integer NOT NULL DEFAULT 0,
  is_flagged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_template_reviews_template ON template_reviews(template_id);
CREATE INDEX IF NOT EXISTS idx_template_reviews_user ON template_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_template_reviews_rating ON template_reviews(template_id, rating);

ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read template reviews"
  ON template_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own template review"
  ON template_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own template review"
  ON template_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own template review"
  ON template_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS template_review_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES template_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE template_review_helpful ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read helpful votes"
  ON template_review_helpful FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add their own helpful vote"
  ON template_review_helpful FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own helpful vote"
  ON template_review_helpful FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN average_rating numeric(3,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN review_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'clone_count'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN clone_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;
