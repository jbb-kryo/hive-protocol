/*
  # Add Notification Preferences to Profiles

  1. Changes
    - Add `notification_preferences` JSONB column to `profiles` table
    - Default value includes all notification settings
    - Stores: email_notifications, swarm_updates, agent_alerts, weekly_digest

  2. Notes
    - Using JSONB for flexibility in adding new preference types
    - Default preferences have email notifications enabled
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{
      "email_notifications": true,
      "swarm_updates": true,
      "agent_alerts": true,
      "weekly_digest": false
    }'::jsonb;
  END IF;
END $$;