/*
  # Blog SEO Enhancements

  1. New Tables
    - `blog_categories`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `name` (text) - Display name
      - `description` (text) - SEO description for category page
      - `meta_title` (text) - Custom meta title
      - `meta_description` (text) - Custom meta description
      - `cover_image` (text) - Category cover image
      - `display_order` (integer) - Ordering priority
      - `created_at` (timestamptz)

    - `blog_tags`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `name` (text) - Display name
      - `description` (text) - SEO description for tag page
      - `post_count` (integer) - Cached count of posts with this tag
      - `created_at` (timestamptz)

    - `blog_authors`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `name` (text) - Display name
      - `bio` (text) - Author biography
      - `avatar_url` (text) - Author avatar image
      - `title` (text) - Job title/role
      - `social_twitter` (text) - Twitter handle
      - `social_linkedin` (text) - LinkedIn URL
      - `social_github` (text) - GitHub username
      - `user_id` (uuid) - Reference to auth.users
      - `created_at` (timestamptz)

  2. Table Modifications
    - Add `author_slug` to `blog_posts` for author page linking
    - Add `category_slug` to `blog_posts` for proper category linking

  3. Security
    - Enable RLS on all new tables
    - Public read access for all blog-related content
    - Admin-only write access

  4. Indexes
    - Slug indexes for fast lookups
    - post_count index for tag popularity sorting
*/

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  meta_title text,
  meta_description text,
  cover_image text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blog categories"
  ON blog_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage blog categories"
  ON blog_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_order ON blog_categories(display_order);

-- Create blog_tags table
CREATE TABLE IF NOT EXISTS blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blog tags"
  ON blog_tags
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage blog tags"
  ON blog_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_post_count ON blog_tags(post_count DESC);

-- Create blog_authors table
CREATE TABLE IF NOT EXISTS blog_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  bio text,
  avatar_url text,
  title text,
  social_twitter text,
  social_linkedin text,
  social_github text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blog authors"
  ON blog_authors
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage blog authors"
  ON blog_authors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_blog_authors_slug ON blog_authors(slug);

-- Add author_slug column to blog_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'author_slug'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN author_slug text DEFAULT 'hive-protocol-team';
  END IF;
END $$;

-- Create index on author_slug
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_slug ON blog_posts(author_slug);

-- Insert default categories matching existing category field
INSERT INTO blog_categories (slug, name, description, meta_title, meta_description, display_order) VALUES
(
  'blog',
  'Blog',
  'Insights, best practices, and deep dives into AI agent orchestration and swarm intelligence.',
  'AI Agent Blog | HIVE Protocol Insights',
  'Read the latest insights on AI agents, swarm intelligence, and multi-agent orchestration from the HIVE Protocol team.',
  1
),
(
  'changelog',
  'Changelog',
  'Track all product updates, improvements, and bug fixes for HIVE Protocol.',
  'Changelog | HIVE Protocol Updates',
  'Stay up to date with the latest HIVE Protocol features, improvements, and bug fixes.',
  2
),
(
  'announcement',
  'Announcements',
  'Important news and announcements about HIVE Protocol and the platform.',
  'Announcements | HIVE Protocol News',
  'Important announcements and news from the HIVE Protocol team.',
  3
),
(
  'tutorial',
  'Tutorials',
  'Step-by-step guides and tutorials for building with AI agents and swarms.',
  'Tutorials | HIVE Protocol Guides',
  'Learn how to build AI agent swarms with our comprehensive tutorials and guides.',
  4
)
ON CONFLICT (slug) DO NOTHING;

-- Insert default tags from existing posts
INSERT INTO blog_tags (slug, name, description) VALUES
('announcement', 'Announcement', 'Official announcements and news'),
('release', 'Release', 'Product releases and version updates'),
('tutorial', 'Tutorial', 'Educational tutorials and guides'),
('getting-started', 'Getting Started', 'Beginner-friendly content'),
('swarms', 'Swarms', 'Content about AI swarm orchestration'),
('agents', 'Agents', 'Content about AI agents'),
('roles', 'Roles', 'Agent roles and responsibilities'),
('best-practices', 'Best Practices', 'Recommended patterns and practices'),
('security', 'Security', 'Security-related content'),
('authentication', 'Authentication', 'Authentication and access control'),
('changelog', 'Changelog', 'Product changelog and updates'),
('updates', 'Updates', 'Platform updates and improvements')
ON CONFLICT (slug) DO NOTHING;

-- Insert default author
INSERT INTO blog_authors (slug, name, bio, title, avatar_url) VALUES
(
  'hive-protocol-team',
  'HIVE Protocol Team',
  'The team behind HIVE Protocol, building the future of AI agent orchestration and swarm intelligence.',
  'Product Team',
  NULL
)
ON CONFLICT (slug) DO NOTHING;

-- Update existing posts to use the default author slug
UPDATE blog_posts SET author_slug = 'hive-protocol-team' WHERE author_slug IS NULL;

-- Function to update tag post counts
CREATE OR REPLACE FUNCTION update_tag_post_counts()
RETURNS void AS $$
DECLARE
  tag_record RECORD;
  tag_count INTEGER;
BEGIN
  FOR tag_record IN SELECT slug FROM blog_tags LOOP
    SELECT COUNT(*) INTO tag_count
    FROM blog_posts
    WHERE status = 'published'
    AND tag_record.slug = ANY(tags);
    
    UPDATE blog_tags SET post_count = tag_count WHERE slug = tag_record.slug;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run initial tag count update
SELECT update_tag_post_counts();