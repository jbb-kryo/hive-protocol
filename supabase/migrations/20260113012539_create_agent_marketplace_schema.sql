/*
  # Agent Marketplace Schema

  Creates complete database schema for the agent marketplace feature.

  ## New Tables
  - marketplace_categories - Categories for organizing marketplace agents
  - marketplace_agents - Published agents available in the marketplace
  - marketplace_reviews - User ratings and reviews
  - marketplace_purchases - Purchase and subscription records
  - marketplace_revenue_shares - Revenue distribution tracking
  - marketplace_agent_analytics - Detailed analytics
  - marketplace_featured_slots - Featured agent slots management
  - marketplace_review_helpful - Helpful vote tracking
*/

CREATE TABLE IF NOT EXISTS marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  long_description text DEFAULT '',
  category_id uuid REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  pricing_type text DEFAULT 'free' CHECK (pricing_type IN ('free', 'one_time', 'subscription')),
  price_amount decimal(10, 2) DEFAULT 0.00,
  billing_interval text CHECK (billing_interval IN ('monthly', 'yearly') OR billing_interval IS NULL),
  configuration jsonb DEFAULT '{}',
  icon_url text DEFAULT '',
  banner_url text DEFAULT '',
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  featured_until timestamptz,
  version text DEFAULT '1.0.0',
  install_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  average_rating decimal(3, 2) DEFAULT 0.00,
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES marketplace_agents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text DEFAULT '',
  comment text DEFAULT '',
  is_verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, user_id)
);

CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES marketplace_agents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purchase_type text NOT NULL CHECK (purchase_type IN ('one_time', 'subscription')),
  amount_paid decimal(10, 2) DEFAULT 0.00,
  currency text DEFAULT 'USD',
  payment_provider text DEFAULT 'stripe',
  payment_id text DEFAULT '',
  subscription_id text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'refunded')),
  billing_interval text CHECK (billing_interval IN ('monthly', 'yearly') OR billing_interval IS NULL),
  current_period_start timestamptz,
  current_period_end timestamptz,
  auto_renew boolean DEFAULT true,
  installed_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS marketplace_revenue_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES marketplace_purchases(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES marketplace_agents(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gross_amount decimal(10, 2) DEFAULT 0.00,
  platform_fee decimal(10, 2) DEFAULT 0.00,
  creator_amount decimal(10, 2) DEFAULT 0.00,
  payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
  payout_date timestamptz,
  payout_id text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_agent_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES marketplace_agents(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  views integer DEFAULT 0,
  unique_viewers integer DEFAULT 0,
  installs integer DEFAULT 0,
  purchases integer DEFAULT 0,
  revenue decimal(10, 2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, date)
);

CREATE TABLE IF NOT EXISTS marketplace_featured_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES marketplace_agents(id) ON DELETE CASCADE NOT NULL,
  slot_position integer NOT NULL CHECK (slot_position >= 1 AND slot_position <= 6),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(slot_position, start_date)
);

CREATE TABLE IF NOT EXISTS marketplace_review_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES marketplace_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_agents_creator ON marketplace_agents(creator_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_agents_category ON marketplace_agents(category_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_agents_published ON marketplace_agents(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_agents_featured ON marketplace_agents(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_agents_tags ON marketplace_agents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_marketplace_agents_slug ON marketplace_agents(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_agent ON marketplace_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_user ON marketplace_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_rating ON marketplace_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_agent ON marketplace_purchases(agent_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_user ON marketplace_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_status ON marketplace_purchases(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_revenue_creator ON marketplace_revenue_shares(creator_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_revenue_status ON marketplace_revenue_shares(payout_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_analytics_agent_date ON marketplace_agent_analytics(agent_id, date DESC);

ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_revenue_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_agent_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_featured_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_review_helpful ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON marketplace_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON marketplace_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view published agents"
  ON marketplace_agents FOR SELECT
  USING (is_published = true OR creator_id = auth.uid());

CREATE POLICY "Creators can create agents"
  ON marketplace_agents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own agents"
  ON marketplace_agents FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own agents"
  ON marketplace_agents FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Public can view reviews for published agents"
  ON marketplace_reviews FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_agents ma 
      WHERE ma.id = marketplace_reviews.agent_id 
      AND ma.is_published = true
    )
  );

CREATE POLICY "Authenticated users can create reviews"
  ON marketplace_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON marketplace_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON marketplace_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases"
  ON marketplace_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create purchases"
  ON marketplace_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases"
  ON marketplace_purchases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can view own revenue"
  ON marketplace_revenue_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all revenue"
  ON marketplace_revenue_shares FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Creators can view own analytics"
  ON marketplace_agent_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_agents
      WHERE marketplace_agents.id = marketplace_agent_analytics.agent_id
      AND marketplace_agents.creator_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view featured slots"
  ON marketplace_featured_slots FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage featured slots"
  ON marketplace_featured_slots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view helpful votes"
  ON marketplace_review_helpful FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote helpful"
  ON marketplace_review_helpful FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own helpful votes"
  ON marketplace_review_helpful FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO marketplace_categories (name, slug, description, icon, display_order) VALUES
  ('Customer Support', 'customer-support', 'Agents specialized in customer service and support', 'headset', 1),
  ('Data Analysis', 'data-analysis', 'Agents for analyzing and visualizing data', 'bar-chart', 2),
  ('Content Creation', 'content-creation', 'Agents that help create and edit content', 'pen-tool', 3),
  ('Development', 'development', 'Agents for coding and software development', 'code', 4),
  ('Marketing', 'marketing', 'Agents for marketing automation and campaigns', 'megaphone', 5),
  ('Sales', 'sales', 'Agents for sales automation and lead generation', 'trending-up', 6),
  ('Research', 'research', 'Agents for research and information gathering', 'search', 7),
  ('Productivity', 'productivity', 'Agents for task management and productivity', 'zap', 8)
ON CONFLICT (slug) DO NOTHING;