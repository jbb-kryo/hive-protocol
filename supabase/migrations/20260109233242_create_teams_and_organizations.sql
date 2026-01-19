/*
  # Teams and Organizations System

  ## Overview
  This migration creates a comprehensive teams/organizations system that enables
  multiple users to collaborate on agents and swarms with role-based permissions.

  ## New Tables

  ### 1. `organizations`
  Team/organization information
  - `id` (uuid, primary key)
  - `name` (text) - Organization name
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Organization description
  - `avatar_url` (text) - Organization logo/avatar
  - `owner_id` (uuid, references auth.users) - Organization owner
  - `plan` (text) - Subscription plan (free, pro, enterprise)
  - `max_members` (integer) - Maximum team members allowed
  - `max_agents` (integer) - Maximum agents allowed
  - `max_swarms` (integer) - Maximum swarms allowed
  - `settings` (jsonb) - Organization settings
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `organization_members`
  Team membership with roles
  - `id` (uuid, primary key)
  - `organization_id` (uuid, references organizations)
  - `user_id` (uuid, references auth.users)
  - `role` (text) - 'owner', 'admin', 'member', 'viewer'
  - `permissions` (jsonb) - Custom permissions override
  - `invited_by` (uuid, references auth.users)
  - `joined_at` (timestamptz)
  - `created_at` (timestamptz)
  - UNIQUE constraint on (organization_id, user_id)

  ### 3. `organization_invitations`
  Pending team invitations
  - `id` (uuid, primary key)
  - `organization_id` (uuid, references organizations)
  - `email` (text) - Invitee email
  - `role` (text) - Intended role
  - `invited_by` (uuid, references auth.users)
  - `token` (text, unique) - Invitation token
  - `expires_at` (timestamptz) - Expiration time
  - `accepted_at` (timestamptz) - Acceptance time (null if pending)
  - `created_at` (timestamptz)

  ### 4. `organization_subscriptions`
  Team billing and subscriptions
  - `id` (uuid, primary key)
  - `organization_id` (uuid, references organizations, unique)
  - `stripe_customer_id` (text) - Stripe customer ID
  - `stripe_subscription_id` (text) - Stripe subscription ID
  - `plan` (text) - Current plan
  - `status` (text) - 'active', 'canceled', 'past_due', 'trialing'
  - `current_period_start` (timestamptz)
  - `current_period_end` (timestamptz)
  - `cancel_at_period_end` (boolean)
  - `trial_end` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `organization_usage`
  Track team resource usage
  - `id` (uuid, primary key)
  - `organization_id` (uuid, references organizations)
  - `period_start` (date)
  - `period_end` (date)
  - `agents_count` (integer)
  - `swarms_count` (integer)
  - `messages_count` (integer)
  - `tokens_used` (bigint)
  - `total_cost` (decimal)
  - `created_at` (timestamptz)

  ### 6. `organization_activity_log`
  Audit log for team actions
  - `id` (uuid, primary key)
  - `organization_id` (uuid, references organizations)
  - `user_id` (uuid, references auth.users)
  - `action` (text) - Action type
  - `resource_type` (text) - Resource affected
  - `resource_id` (uuid) - Resource ID
  - `details` (jsonb) - Additional details
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Organization members can view their organization
  - Only owners and admins can manage members
  - Only owners can delete organizations
  - Members can view shared resources

  ## Indexes
  - Performance indexes on foreign keys
  - Indexes for common query patterns
*/

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  avatar_url text DEFAULT '',
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  max_members integer DEFAULT 5,
  max_agents integer DEFAULT 10,
  max_swarms integer DEFAULT 5,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions jsonb DEFAULT '{}',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Organization invitations table
CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz DEFAULT (now() + INTERVAL '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Organization subscriptions table
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id text DEFAULT '',
  stripe_subscription_id text DEFAULT '',
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT (now() + INTERVAL '30 days'),
  cancel_at_period_end boolean DEFAULT false,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization usage tracking table
CREATE TABLE IF NOT EXISTS organization_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  agents_count integer DEFAULT 0,
  swarms_count integer DEFAULT 0,
  messages_count integer DEFAULT 0,
  tokens_used bigint DEFAULT 0,
  total_cost decimal(10, 4) DEFAULT 0.0000,
  created_at timestamptz DEFAULT now()
);

-- Organization activity log table
CREATE TABLE IF NOT EXISTS organization_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text DEFAULT '',
  resource_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token);

CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_stripe ON organization_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_org_usage_org ON organization_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_usage_period ON organization_usage(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_org_activity_org ON organization_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_activity_user ON organization_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_org_activity_created ON organization_activity_log(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they are members of"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Only owners can delete organizations"
  ON organizations FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for organization_members
CREATE POLICY "Members can view their organization members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can add members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_members.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can remove members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for organization_invitations
CREATE POLICY "Members can view organization invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
    ) OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can create invitations"
  ON organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete invitations"
  ON organization_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for organization_subscriptions
CREATE POLICY "Members can view organization subscription"
  ON organization_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_subscriptions.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage subscriptions"
  ON organization_subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_subscriptions.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- RLS Policies for organization_usage
CREATE POLICY "Members can view organization usage"
  ON organization_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_usage.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for organization_activity_log
CREATE POLICY "Members can view organization activity"
  ON organization_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_activity_log.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Function to automatically add owner as member when creating organization
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.owner_id, 'owner', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_owner_as_member_trigger
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

-- Function to log organization activity
CREATE OR REPLACE FUNCTION log_organization_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_activity_log (organization_id, user_id, action, resource_type, resource_id, details)
  VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add activity logging triggers
CREATE TRIGGER log_org_members_activity
  AFTER INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION log_organization_activity();
