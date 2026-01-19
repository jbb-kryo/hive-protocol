/*
  # Create Blog/Changelog System

  1. New Tables
    - `blog_posts`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `title` (text, required) - post title
      - `excerpt` (text) - short summary for listing
      - `content` (text, required) - markdown content
      - `cover_image` (text) - URL to cover image
      - `author_id` (uuid) - reference to profiles
      - `author_name` (text) - author display name (for flexibility)
      - `category` (text) - post category (blog, changelog, announcement)
      - `tags` (text[]) - array of tags
      - `status` (text) - draft, published, archived
      - `published_at` (timestamptz) - when post was published
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp
      - `read_time` (integer) - estimated read time in minutes
      - `version` (text) - version number for changelog entries

  2. Security
    - Enable RLS on `blog_posts` table
    - Public can read published posts
    - Only admins can create/update/delete posts

  3. Indexes
    - Index on slug for fast lookups
    - Index on status and published_at for listing queries
    - Index on category for filtering
*/

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'Hive Protocol Team',
  category text NOT NULL DEFAULT 'blog',
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  read_time integer DEFAULT 5,
  version text,
  CONSTRAINT valid_category CHECK (category IN ('blog', 'changelog', 'announcement', 'tutorial')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived'))
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_at <= now());

CREATE POLICY "Admins can manage all posts"
  ON blog_posts
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

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

CREATE OR REPLACE FUNCTION update_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_blog_post_updated_at ON blog_posts;
CREATE TRIGGER trigger_update_blog_post_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_updated_at();

INSERT INTO blog_posts (slug, title, excerpt, content, category, status, published_at, read_time, version, tags) VALUES
(
  'introducing-hive-protocol-v2',
  'Introducing Hive Protocol v2.0',
  'We are thrilled to announce the release of Hive Protocol v2.0, featuring enhanced swarm intelligence, improved agent coordination, and a completely redesigned dashboard.',
  '## A New Era of AI Agent Orchestration

We are thrilled to announce the release of **Hive Protocol v2.0**, our most ambitious update yet. This release represents months of development, feedback from our amazing community, and our vision for the future of AI agent orchestration.

### What''s New in v2.0

#### Enhanced Swarm Intelligence

Our new swarm algorithms enable agents to collaborate more effectively than ever before. Key improvements include:

- **Adaptive Load Balancing**: Agents automatically distribute tasks based on current workload and capabilities
- **Consensus Mechanisms**: New voting and agreement protocols for multi-agent decisions
- **Emergent Behavior Detection**: Real-time monitoring of swarm patterns and anomalies

#### Redesigned Dashboard

The dashboard has been completely rebuilt from the ground up:

- **Real-time Metrics**: Live updates on agent status, task completion, and system health
- **Interactive Visualizations**: New charts and graphs for better insights
- **Customizable Layouts**: Arrange your workspace the way you want

#### New Tool System

Tools are now first-class citizens in Hive Protocol:

```typescript
const tool = await hive.createTool({
  name: "web-search",
  description: "Search the web for information",
  parameters: {
    query: { type: "string", required: true }
  }
});
```

### Migration Guide

Upgrading from v1.x? Check out our [migration guide](/docs/guides/migration) for step-by-step instructions.

### What''s Next

We''re already working on v2.1, which will include:

- Multi-tenant support for enterprise customers
- Advanced analytics and reporting
- Integration with more AI providers

Thank you for being part of our journey. We can''t wait to see what you build with Hive Protocol v2.0!',
  'announcement',
  'published',
  now() - interval '2 days',
  8,
  '2.0.0',
  ARRAY['announcement', 'release', 'v2']
),
(
  'building-your-first-swarm',
  'Building Your First AI Swarm: A Complete Guide',
  'Learn how to create, configure, and deploy your first AI swarm with Hive Protocol. This tutorial covers everything from basic setup to advanced coordination patterns.',
  '## Getting Started with AI Swarms

In this comprehensive guide, we''ll walk through building your first AI swarm from scratch. By the end, you''ll have a fully functional swarm capable of handling complex, multi-step tasks.

### Prerequisites

Before we begin, make sure you have:

- A Hive Protocol account (free tier works fine)
- Basic understanding of AI agents
- Familiarity with JavaScript/TypeScript

### Step 1: Create Your Swarm

Navigate to the dashboard and click "Create Swarm". Give it a meaningful name:

```javascript
const swarm = await hive.swarms.create({
  name: "Research Assistant Swarm",
  description: "A swarm for automated research tasks"
});
```

### Step 2: Add Agents

A swarm needs agents to do the work. Let''s add a few specialized agents:

```javascript
// Research agent - finds information
await swarm.addAgent({
  name: "Researcher",
  role: "primary",
  capabilities: ["web-search", "document-analysis"]
});

// Writer agent - synthesizes findings
await swarm.addAgent({
  name: "Writer", 
  role: "secondary",
  capabilities: ["content-generation", "summarization"]
});

// Reviewer agent - ensures quality
await swarm.addAgent({
  name: "Reviewer",
  role: "observer",
  capabilities: ["fact-checking", "editing"]
});
```

### Step 3: Configure Coordination

Set up how your agents communicate:

```javascript
await swarm.setCoordinationMode("collaborative");
await swarm.enableFeature("consensus-voting");
```

### Step 4: Test Your Swarm

Send a test message to see your swarm in action:

```javascript
const response = await swarm.chat({
  message: "Research the latest trends in AI orchestration"
});

console.log(response.content);
```

### Best Practices

1. **Start Simple**: Begin with 2-3 agents and add more as needed
2. **Define Clear Roles**: Each agent should have a specific purpose
3. **Monitor Performance**: Use the dashboard to track agent interactions
4. **Iterate**: Refine your swarm based on results

### Conclusion

You now have a working AI swarm! Experiment with different agent configurations and coordination patterns to find what works best for your use case.

Next up: [Advanced Swarm Patterns](/docs/guides/advanced-patterns)',
  'tutorial',
  'published',
  now() - interval '5 days',
  12,
  NULL,
  ARRAY['tutorial', 'getting-started', 'swarms']
),
(
  'changelog-january-2026',
  'January 2026 Changelog',
  'All the updates, improvements, and bug fixes from January 2026.',
  '## January 2026 Updates

Here''s everything that shipped in January 2026.

### Week 4 (Jan 22-28)

#### New Features
- **Webhook System**: Configure webhooks to receive real-time notifications about swarm events
- **Two-Factor Authentication**: Added 2FA support for enhanced account security
- **Avatar Upload**: Customize your profile with a custom avatar

#### Improvements
- Improved agent response times by 40%
- Better error messages for API failures
- Enhanced mobile responsiveness on dashboard

#### Bug Fixes
- Fixed issue where swarm messages would occasionally duplicate
- Resolved timezone display bug in activity feed
- Fixed avatar not updating immediately after upload

---

### Week 3 (Jan 15-21)

#### New Features
- **Tool Marketplace**: Browse and install community-created tools
- **Agent Templates**: Quick-start with pre-configured agent setups
- **Export Functionality**: Download swarm conversations as JSON or Markdown

#### Improvements
- Reduced dashboard load time by 60%
- Added keyboard shortcuts for common actions
- Improved search functionality in agent list

#### Bug Fixes
- Fixed memory leak in real-time presence system
- Resolved issue with special characters in tool names
- Fixed pagination in admin user list

---

### Week 2 (Jan 8-14)

#### New Features
- **Dark Mode**: Toggle between light and dark themes
- **Notification Preferences**: Granular control over email notifications
- **API Rate Limiting Dashboard**: Monitor your API usage in real-time

#### Improvements
- Better onboarding flow for new users
- Improved documentation search
- Enhanced accessibility across all pages

#### Bug Fixes
- Fixed login redirect loop on certain browsers
- Resolved issue with date formatting in different locales
- Fixed tool execution timeout handling

---

### Week 1 (Jan 1-7)

#### New Features
- **Activity Feed**: See all swarm activity in one place
- **Broadcast Messages**: Send messages to all agents at once
- **Context Management**: Add and manage context blocks for swarms

#### Improvements
- Faster page transitions
- Better error recovery in chat interface
- Improved agent status indicators

#### Bug Fixes
- Fixed issue with swarm creation failing silently
- Resolved WebSocket reconnection issues
- Fixed incorrect agent count display',
  'changelog',
  'published',
  now() - interval '1 day',
  6,
  NULL,
  ARRAY['changelog', 'updates', 'january-2026']
),
(
  'understanding-agent-roles',
  'Understanding Agent Roles: Primary, Secondary, and Observer',
  'Dive deep into the three agent roles in Hive Protocol and learn when to use each one for optimal swarm performance.',
  '## The Three Pillars of Agent Organization

In Hive Protocol, every agent in a swarm has a designated role that determines its behavior, permissions, and interaction patterns. Understanding these roles is crucial for building effective swarms.

### Primary Agents

Primary agents are the workhorses of your swarm. They:

- **Lead Conversations**: Primary agents typically initiate and drive task execution
- **Have Full Permissions**: Can create, modify, and delete resources
- **Coordinate Others**: Often delegate sub-tasks to secondary agents

**When to use**: For agents that need to take initiative and make decisions independently.

```javascript
await swarm.addAgent({
  name: "Project Manager",
  role: "primary",
  capabilities: ["task-planning", "delegation", "progress-tracking"]
});
```

### Secondary Agents

Secondary agents support primary agents by:

- **Executing Delegated Tasks**: Receive and complete tasks from primary agents
- **Providing Specialized Skills**: Often have deep expertise in specific areas
- **Reporting Back**: Share results with primary agents for synthesis

**When to use**: For specialized agents that excel at specific tasks.

```javascript
await swarm.addAgent({
  name: "Data Analyst",
  role: "secondary",
  capabilities: ["data-processing", "visualization", "statistics"]
});
```

### Observer Agents

Observers monitor without directly participating:

- **Quality Assurance**: Review outputs from other agents
- **Compliance Checking**: Ensure outputs meet requirements
- **Learning**: Gather data to improve future performance

**When to use**: For oversight, auditing, or learning purposes.

```javascript
await swarm.addAgent({
  name: "Quality Reviewer",
  role: "observer",
  capabilities: ["review", "feedback", "scoring"]
});
```

### Role Combinations in Practice

Here''s a real-world example of a content creation swarm:

| Agent | Role | Purpose |
|-------|------|---------|
| Content Strategist | Primary | Plans content, assigns topics |
| Writer | Secondary | Creates draft content |
| Editor | Secondary | Refines and polishes drafts |
| SEO Specialist | Secondary | Optimizes for search |
| Brand Guardian | Observer | Ensures brand consistency |

### Best Practices

1. **Balance Your Roles**: Too many primary agents can cause conflicts
2. **Define Clear Boundaries**: Each role should have distinct responsibilities
3. **Use Observers Wisely**: They add overhead, so use them strategically
4. **Document Role Expectations**: Help agents understand their purpose

### Conclusion

Choosing the right roles for your agents is fundamental to swarm success. Start with a simple structure and evolve it based on your needs.',
  'blog',
  'published',
  now() - interval '7 days',
  10,
  NULL,
  ARRAY['agents', 'roles', 'best-practices']
),
(
  'security-best-practices',
  'Security Best Practices for AI Agent Swarms',
  'Learn how to secure your AI swarms with authentication, encryption, and access control best practices.',
  '## Securing Your AI Swarms

As AI agents become more capable, security becomes increasingly important. This guide covers essential security practices for Hive Protocol.

### Authentication & Access Control

#### Enable Two-Factor Authentication

Protect your account with 2FA:

1. Go to Settings > Security
2. Click "Enable Two-Factor Authentication"
3. Scan the QR code with your authenticator app
4. Store backup codes in a secure location

#### Use API Keys Wisely

- **Rotate Regularly**: Change API keys every 90 days
- **Scope Appropriately**: Use the minimum permissions needed
- **Never Commit**: Keep keys out of version control

```bash
# Bad - exposed in code
const apiKey = "sk_live_abc123";

# Good - use environment variables
const apiKey = process.env.HIVE_API_KEY;
```

### Data Protection

#### Encrypt Sensitive Data

All data in Hive Protocol is encrypted at rest and in transit. For extra-sensitive data:

- Use the secure credentials system for API keys
- Enable end-to-end encryption for swarm messages
- Implement field-level encryption for PII

#### Minimize Data Collection

Only collect what you need:

```javascript
// Configure agent to not store certain data
await agent.configure({
  dataRetention: {
    excludeFields: ["password", "ssn", "creditCard"],
    autoDelete: "30d"
  }
});
```

### Network Security

#### Webhook Verification

Always verify webhook signatures:

```javascript
const isValid = hive.webhooks.verify(
  payload,
  signature,
  secret
);

if (!isValid) {
  throw new Error("Invalid webhook signature");
}
```

#### IP Allowlisting

Restrict API access to known IPs:

1. Go to Settings > Security > IP Allowlist
2. Add your server IP addresses
3. Enable strict mode

### Monitoring & Auditing

#### Enable Activity Logging

Track all actions in your swarms:

- User logins and logouts
- Agent creation and deletion
- Configuration changes
- Data exports

#### Set Up Alerts

Configure alerts for suspicious activity:

- Multiple failed login attempts
- Unusual API usage patterns
- Unauthorized access attempts

### Incident Response

Have a plan ready:

1. **Detect**: Monitor for anomalies
2. **Contain**: Isolate affected systems
3. **Investigate**: Determine root cause
4. **Remediate**: Fix the vulnerability
5. **Learn**: Update procedures

### Checklist

- [ ] 2FA enabled on all accounts
- [ ] API keys rotated and scoped
- [ ] Webhook signatures verified
- [ ] Activity logging enabled
- [ ] Incident response plan documented

Stay secure!',
  'blog',
  'published',
  now() - interval '10 days',
  9,
  NULL,
  ARRAY['security', 'best-practices', 'authentication']
)
ON CONFLICT (slug) DO NOTHING;