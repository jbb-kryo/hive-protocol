/*
  # Agent Marketplace Schema

  ## Overview
  This migration creates the complete database schema for the agent marketplace feature,
  enabling users to share, discover, purchase, and monetize pre-configured agents.

  ## New Tables

  ### 1. `marketplace_categories`
  Categories for organizing marketplace agents
  - `id` (uuid, primary key)
  - `name` (text, unique) - Category name (e.g., "Customer Support", "Data Analysis")
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Category description
  - `icon` (text) - Icon identifier
  - `display_order` (integer) - Sort order for display
  - `created_at` (timestamptz)

  ### 2. `marketplace_agents`
  Published agents available in the marketplace
  - `id` (uuid, primary key)
  - `creator_id` (uuid, references auth.users) - Agent creator
  - `source_agent_id` (uuid, references agents) - Original agent template
  - `name` (text) - Agent display name
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Short description
  - `long_description` (text) - Detailed description with features
  - `category_id` (uuid, references marketplace_categories)
  - `tags` (text[]) - Searchable tags
  - `pricing_type` (text) - 'free', 'one_time', 'subscription'
  - `price_amount` (decimal) - Price in USD
  - `billing_interval` (text) - 'monthly', 'yearly' for subscriptions
  - `configuration` (jsonb) - Agent configuration (tools, model, etc.)
  - `icon_url` (text) - Agent icon/avatar
  - `banner_url` (text) - Banner image for detail page
  - `is_published` (boolean) - Whether visible in marketplace
  - `is_featured` (boolean) - Featured in marketplace
  - `featured_until` (timestamptz) - Featured expiration date
  - `version` (text) - Current version (e.g., "1.0.0")
  - `install_count` (integer) - Total installs
  - `view_count` (integer) - Total views
  - `average_rating` (decimal) - Calculated average rating
  - `review_count` (integer) - Total number of reviews
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `published_at` (timestamptz) - First publication date

  ### 3. `marketplace_reviews`
  User ratings and reviews for marketplace agents
  - `id` (uuid, primary key)
  - `agent_id` (uuid, references marketplace_agents)
  - `user_id` (uuid, references auth.users)
  - `rating` (integer) - 1-5 star rating
  - `title` (text) - Review title
  - `comment` (text) - Review text
  - `is_verified_purchase` (boolean) - Whether user purchased the agent
  - `helpful_count` (integer) - Number of "helpful" votes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - UNIQUE constraint on (agent_id, user_id) - One review per user per agent

  ### 4. `marketplace_purchases`
  Purchase and subscription records for premium agents
  - `id` (uuid, primary key)
  - `agent_id` (uuid, references marketplace_agents)
  - `user_id` (uuid, references auth.users)
  - `purchase_type` (text) - 'one_time', 'subscription'
  - `amount_paid` (decimal) - Amount paid in USD
  - `currency` (text) - Currency code (default 'USD')
  - `payment_provider` (text) - 'stripe', etc.
  - `payment_id` (text) - External payment ID
  - `subscription_id` (text) - External subscription ID
  - `status` (text) - 'active', 'cancelled', 'expired', 'refunded'
  - `billing_interval` (text) - 'monthly', 'yearly'
  - `current_period_start` (timestamptz) - Subscription period start
  - `current_period_end` (timestamptz) - Subscription period end
  - `auto_renew` (boolean) - Auto-renewal enabled
  - `installed_agent_id` (uuid, references agents) - The agent instance created
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `cancelled_at` (timestamptz)
  - `expires_at` (timestamptz)

  ### 5. `marketplace_revenue_shares`
  Revenue distribution tracking for creator payouts
  - `id` (uuid, primary key)
  - `purchase_id` (uuid, references marketplace_purchases)
  - `agent_id` (uuid, references marketplace_agents)
  - `creator_id` (uuid, references auth.users)
  - `gross_amount` (decimal) - Total amount paid
  - `platform_fee` (decimal) - Platform fee (e.g., 20%)
  - `creator_amount` (decimal) - Amount for creator
  - `payout_status` (text) - 'pending', 'processing', 'completed', 'failed'
  - `payout_date` (timestamptz) - When payout was processed
  - `payout_id` (text) - External payout ID
  - `created_at` (timestamptz)

  ### 6. `marketplace_agent_analytics`
  Detailed analytics for marketplace agents
  - `id` (uuid, primary key)
  - `agent_id` (uuid, references marketplace_agents)
  - `date` (date) - Analytics date
  - `views` (integer) - Daily views
  - `unique_viewers` (integer) - Unique users
  - `installs` (integer) - Daily installs
  - `purchases` (integer) - Daily purchases
  - `revenue` (decimal) - Daily revenue
  - `created_at` (timestamptz)
  - UNIQUE constraint on (agent_id, date)

  ### 7. `marketplace_featured_slots`
  Management of featured agent slots
  - `id` (uuid, primary key)
  - `agent_id` (uuid, references marketplace_agents)
  - `slot_position` (integer) - Display position (1-6)
  - `start_date` (timestamptz) - Feature start date
  - `end_date` (timestamptz) - Feature end date
  - `created_by` (uuid, references auth.users) - Admin who created
  - `created_at` (timestamptz)

  ### 8. `marketplace_review_helpful`
  Tracking which users found reviews helpful
  - `id` (uuid, primary key)
  - `review_id` (uuid, references marketplace_reviews)
  - `user_id` (uuid, references auth.users)
  - `created_at` (timestamptz)
  - UNIQUE constraint on (review_id, user_id)

  ## Security
  - Enable RLS on all tables
  - Creators can manage their own agents
  - Users can manage their own reviews and purchases
  - Public read access for published agents and reviews
  - Authenticated users can purchase agents
  - Admin-only access for featured slots and revenue tracking

  ## Indexes
  - Performance indexes on foreign keys
  - Search indexes on name, description, tags
  - Analytics indexes on date ranges
*/

-- Categories table
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Marketplace agents table
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

-- Reviews table
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

-- Purchases table
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

-- Revenue shares table
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

-- Agent analytics table
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

-- Featured slots table
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

-- Review helpful tracking table
CREATE TABLE IF NOT EXISTS marketplace_review_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES marketplace_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Indexes for performance
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

-- Enable RLS on all tables
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_revenue_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_agent_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_featured_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_review_helpful ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_categories
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

-- RLS Policies for marketplace_agents
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

-- RLS Policies for marketplace_reviews
CREATE POLICY "Anyone can view reviews"
  ON marketplace_reviews FOR SELECT
  USING (true);

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

-- RLS Policies for marketplace_purchases
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

-- RLS Policies for marketplace_revenue_shares
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

CREATE POLICY "System can create revenue records"
  ON marketplace_revenue_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for marketplace_agent_analytics
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

CREATE POLICY "Admins can view all analytics"
  ON marketplace_agent_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for marketplace_featured_slots
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

-- RLS Policies for marketplace_review_helpful
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

-- Insert default categories
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
