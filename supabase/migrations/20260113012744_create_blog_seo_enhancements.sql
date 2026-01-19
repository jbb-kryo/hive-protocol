/*
  # Blog SEO Enhancements

  1. New Tables
    - blog_categories - Categories for blog posts
    - blog_tags - Tags for blog posts
    - blog_authors - Author profiles for blog posts

  2. Table Modifications
    - Add author_slug to blog_posts for author page linking
*/

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'author_slug'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN author_slug text DEFAULT 'hive-protocol-team';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blog_posts_author_slug ON blog_posts(author_slug);

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

INSERT INTO blog_authors (slug, name, bio, title, avatar_url) VALUES
(
  'hive-protocol-team',
  'HIVE Protocol Team',
  'The team behind HIVE Protocol, building the future of AI agent orchestration and swarm intelligence.',
  'Product Team',
  NULL
)
ON CONFLICT (slug) DO NOTHING;

UPDATE blog_posts SET author_slug = 'hive-protocol-team' WHERE author_slug IS NULL;