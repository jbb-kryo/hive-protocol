/*
  # Enhance Default Agents for Templates

  1. Schema Changes
    - Add `description` column to default_agents for template descriptions
    - Add `tags` array column for filtering and categorization
    - Add `category` column for grouping templates
    - Add `icon` column for visual representation

  2. Data Changes
    - Update existing agents with new fields
    - Add additional useful template agents (10 total)

  3. Security
    - RLS already enabled on default_agents table
    - Add policy for authenticated users to read all templates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'description'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'tags'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN tags text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'category'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN category text DEFAULT 'general';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'default_agents' AND column_name = 'icon'
  ) THEN
    ALTER TABLE default_agents ADD COLUMN icon text DEFAULT 'Bot';
  END IF;
END $$;

UPDATE default_agents
SET 
  description = 'A thorough research assistant that analyzes information, identifies patterns, and delivers comprehensive summaries with source citations.',
  tags = ARRAY['research', 'analysis', 'academic', 'summarization'],
  category = 'research',
  icon = 'Search'
WHERE name = 'Research Assistant';

UPDATE default_agents
SET 
  description = 'Expert software developer ready to help with coding tasks, debugging, code explanations, and best practice recommendations.',
  tags = ARRAY['coding', 'development', 'debugging', 'programming'],
  category = 'development',
  icon = 'Code'
WHERE name = 'Code Helper';

UPDATE default_agents
SET 
  description = 'Versatile creative writer skilled in storytelling, content creation, copywriting, and adapting to various writing styles.',
  tags = ARRAY['writing', 'content', 'creative', 'copywriting'],
  category = 'creative',
  icon = 'PenTool'
WHERE name = 'Creative Writer';

UPDATE default_agents
SET 
  description = 'Skilled data analyst that interprets data, creates visualizations, and provides actionable insights and recommendations.',
  tags = ARRAY['data', 'analytics', 'visualization', 'insights'],
  category = 'analytics',
  icon = 'BarChart'
WHERE name = 'Data Analyst';

INSERT INTO default_agents (name, role, framework, system_prompt, settings, is_active, sort_order, description, tags, category, icon)
SELECT 
  'Customer Support Agent',
  'support',
  'anthropic',
  'You are a friendly and professional customer support agent. Help users resolve issues efficiently while maintaining a positive tone. Gather relevant information, troubleshoot problems systematically, and escalate complex issues when necessary. Always prioritize customer satisfaction.',
  '{"temperature": 0.5}'::jsonb,
  true,
  5,
  'Professional customer support agent that handles inquiries, troubleshoots issues, and ensures customer satisfaction.',
  ARRAY['support', 'customer service', 'helpdesk', 'troubleshooting'],
  'support',
  'Headphones'
WHERE NOT EXISTS (SELECT 1 FROM default_agents WHERE name = 'Customer Support Agent');

INSERT INTO default_agents (name, role, framework, system_prompt, settings, is_active, sort_order, description, tags, category, icon)
SELECT 
  'Project Manager',
  'coordinator',
  'langchain',
  'You are an experienced project manager. Help organize tasks, track progress, identify blockers, and facilitate team collaboration. Break down complex projects into manageable milestones, suggest timelines, and provide status updates. Keep teams aligned and projects on track.',
  '{"temperature": 0.6}'::jsonb,
  true,
  6,
  'Organized project manager that coordinates tasks, tracks progress, and keeps teams aligned on deliverables.',
  ARRAY['project management', 'coordination', 'planning', 'agile'],
  'productivity',
  'Kanban'
WHERE NOT EXISTS (SELECT 1 FROM default_agents WHERE name = 'Project Manager');

INSERT INTO default_agents (name, role, framework, system_prompt, settings, is_active, sort_order, description, tags, category, icon)
SELECT 
  'Marketing Strategist',
  'strategist',
  'crewai',
  'You are a marketing strategist with expertise in digital marketing, branding, and growth. Analyze market trends, develop campaign strategies, and provide actionable recommendations. Focus on ROI, audience engagement, and brand consistency across all channels.',
  '{"temperature": 0.7}'::jsonb,
  true,
  7,
  'Strategic marketing expert that develops campaigns, analyzes trends, and drives brand growth.',
  ARRAY['marketing', 'strategy', 'branding', 'campaigns'],
  'business',
  'TrendingUp'
WHERE NOT EXISTS (SELECT 1 FROM default_agents WHERE name = 'Marketing Strategist');

INSERT INTO default_agents (name, role, framework, system_prompt, settings, is_active, sort_order, description, tags, category, icon)
SELECT 
  'Technical Writer',
  'documenter',
  'anthropic',
  'You are a technical writer who creates clear, accurate documentation. Transform complex technical information into user-friendly guides, API documentation, tutorials, and knowledge base articles. Maintain consistency in style and terminology while ensuring content is accessible to the target audience.',
  '{"temperature": 0.4}'::jsonb,
  true,
  8,
  'Expert documentation writer that creates clear guides, API docs, and technical content.',
  ARRAY['documentation', 'technical writing', 'guides', 'tutorials'],
  'development',
  'FileText'
WHERE NOT EXISTS (SELECT 1 FROM default_agents WHERE name = 'Technical Writer');

INSERT INTO default_agents (name, role, framework, system_prompt, settings, is_active, sort_order, description, tags, category, icon)
SELECT 
  'Security Analyst',
  'security',
  'autogen',
  'You are a cybersecurity analyst focused on identifying vulnerabilities and ensuring system security. Review code for security issues, analyze potential threats, recommend security best practices, and help implement secure solutions. Stay updated on the latest security threats and mitigation strategies.',
  '{"temperature": 0.3}'::jsonb,
  true,
  9,
  'Cybersecurity expert that identifies vulnerabilities, reviews code, and implements security best practices.',
  ARRAY['security', 'cybersecurity', 'vulnerability', 'compliance'],
  'development',
  'Shield'
WHERE NOT EXISTS (SELECT 1 FROM default_agents WHERE name = 'Security Analyst');

INSERT INTO default_agents (name, role, framework, system_prompt, settings, is_active, sort_order, description, tags, category, icon)
SELECT 
  'UX Designer',
  'designer',
  'custom',
  'You are a UX designer focused on creating intuitive user experiences. Analyze user flows, suggest interface improvements, create wireframe descriptions, and provide accessibility recommendations. Balance aesthetics with usability while keeping the user at the center of all design decisions.',
  '{"temperature": 0.6}'::jsonb,
  true,
  10,
  'User experience designer that creates intuitive interfaces and improves product usability.',
  ARRAY['design', 'ux', 'user experience', 'accessibility'],
  'creative',
  'Layout'
WHERE NOT EXISTS (SELECT 1 FROM default_agents WHERE name = 'UX Designer');

DROP POLICY IF EXISTS "Anyone can read default agents" ON default_agents;
CREATE POLICY "Anyone can read default agents"
  ON default_agents FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage default agents" ON default_agents;
CREATE POLICY "Admins can manage default agents"
  ON default_agents FOR ALL
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

CREATE INDEX IF NOT EXISTS idx_default_agents_category ON default_agents(category);
CREATE INDEX IF NOT EXISTS idx_default_agents_is_active ON default_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_default_agents_tags ON default_agents USING GIN(tags);