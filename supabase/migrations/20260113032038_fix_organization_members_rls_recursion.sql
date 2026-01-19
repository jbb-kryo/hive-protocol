/*
  # Fix Organization Members RLS Recursion

  ## Problem
  The RLS policies on organization_members table reference the same table in their
  USING clauses, causing infinite recursion when any query is made.

  ## Solution
  1. Create a security definer function to check membership without triggering RLS
  2. Drop the problematic policies
  3. Create new policies using the security definer function

  ## Changes
  - Create is_org_member() function with SECURITY DEFINER
  - Create is_org_admin() function with SECURITY DEFINER  
  - Drop and recreate organization_members policies
  - Update related policies on other organization tables
*/

CREATE OR REPLACE FUNCTION is_org_member(org_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
    AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_org_owner(org_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
    AND role = 'owner'
  );
$$;

DROP POLICY IF EXISTS "Members can view their organization members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON organization_members;

CREATE POLICY "Members can view their organization members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    is_org_member(organization_id, auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Owners and admins can add members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_admin(organization_id, auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Owners and admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid())
  )
  WITH CHECK (
    is_org_admin(organization_id, auth.uid())
  );

CREATE POLICY "Owners and admins can remove members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON organizations;

CREATE POLICY "Users can view organizations they are members of"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    is_org_member(id, auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Owners and admins can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    is_org_admin(id, auth.uid())
  )
  WITH CHECK (
    is_org_admin(id, auth.uid())
  );

DROP POLICY IF EXISTS "Members can view organization invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON organization_invitations;

CREATE POLICY "Members can view organization invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    is_org_member(organization_id, auth.uid())
  );

CREATE POLICY "Admins can create invitations"
  ON organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_admin(organization_id, auth.uid())
  );

CREATE POLICY "Admins can delete invitations"
  ON organization_invitations FOR DELETE
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Members can view organization subscription" ON organization_subscriptions;
DROP POLICY IF EXISTS "Owners can manage subscriptions" ON organization_subscriptions;

CREATE POLICY "Members can view organization subscription"
  ON organization_subscriptions FOR SELECT
  TO authenticated
  USING (
    is_org_member(organization_id, auth.uid())
  );

CREATE POLICY "Owners can manage subscriptions"
  ON organization_subscriptions FOR ALL
  TO authenticated
  USING (
    is_org_owner(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Members can view organization usage" ON organization_usage;

CREATE POLICY "Members can view organization usage"
  ON organization_usage FOR SELECT
  TO authenticated
  USING (
    is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Members can view organization activity" ON organization_activity_log;

CREATE POLICY "Members can view organization activity"
  ON organization_activity_log FOR SELECT
  TO authenticated
  USING (
    is_org_member(organization_id, auth.uid())
  );
