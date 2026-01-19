/*
  # Fix Tools RLS Infinite Recursion

  1. Changes
    - Drop the problematic "Users can view tools assigned to their swarms" policy
    - This policy causes infinite recursion by joining swarms table
    - Users can already view tools through:
      * System tools (is_system = true)
      * Own tools (created_by = auth.uid())
      * Team tools (via organization_members)
      * Tools are also accessible through swarm_tools when viewing a specific swarm
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view tools assigned to their swarms" ON tools;