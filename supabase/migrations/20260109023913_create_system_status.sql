/*
  # Create System Status Tracking

  1. New Tables
    - `system_services`
      - `id` (uuid, primary key)
      - `name` (text) - Service name (API, Database, etc.)
      - `slug` (text, unique) - URL-friendly identifier
      - `description` (text) - Service description
      - `status` (text) - Current status (operational, degraded, partial_outage, major_outage)
      - `uptime_percentage` (numeric) - Historical uptime percentage
      - `last_checked_at` (timestamptz) - Last status check time
      - `order_index` (int) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `system_incidents`
      - `id` (uuid, primary key)
      - `title` (text) - Incident title
      - `description` (text) - Incident description
      - `status` (text) - investigating, identified, monitoring, resolved
      - `severity` (text) - minor, major, critical
      - `affected_services` (uuid[]) - Array of affected service IDs
      - `started_at` (timestamptz) - When incident started
      - `resolved_at` (timestamptz) - When incident was resolved
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `incident_updates`
      - `id` (uuid, primary key)
      - `incident_id` (uuid, foreign key)
      - `status` (text) - Status at time of update
      - `message` (text) - Update message
      - `created_at` (timestamptz)

    - `status_subscribers`
      - `id` (uuid, primary key)
      - `email` (text, unique) - Subscriber email
      - `verified` (boolean) - Email verified
      - `subscribed_at` (timestamptz)
      - `unsubscribed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for status/incidents
    - Admin-only write access
*/

-- Create system_services table
CREATE TABLE IF NOT EXISTS system_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance')),
  uptime_percentage numeric(5,2) DEFAULT 100.00,
  last_checked_at timestamptz DEFAULT now(),
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system services"
  ON system_services
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create system_incidents table
CREATE TABLE IF NOT EXISTS system_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  affected_services uuid[] DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system incidents"
  ON system_incidents
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create incident_updates table
CREATE TABLE IF NOT EXISTS incident_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES system_incidents(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view incident updates"
  ON incident_updates
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create status_subscribers table
CREATE TABLE IF NOT EXISTS status_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  verified boolean DEFAULT false,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz
);

ALTER TABLE status_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view their own subscription"
  ON status_subscribers
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Anyone can subscribe"
  ON status_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Insert default services
INSERT INTO system_services (name, slug, description, status, uptime_percentage, order_index) VALUES
  ('API', 'api', 'Core API endpoints for agent management and swarm orchestration', 'operational', 99.98, 1),
  ('Database', 'database', 'PostgreSQL database for persistent data storage', 'operational', 99.99, 2),
  ('Authentication', 'auth', 'User authentication and session management', 'operational', 99.97, 3),
  ('Edge Functions', 'edge-functions', 'Serverless functions for real-time processing', 'operational', 99.95, 4),
  ('Real-time', 'realtime', 'WebSocket connections for live updates', 'operational', 99.92, 5),
  ('Storage', 'storage', 'File storage for avatars and attachments', 'operational', 99.99, 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample resolved incident for history
INSERT INTO system_incidents (title, description, status, severity, started_at, resolved_at) VALUES
  (
    'Elevated API Latency',
    'We experienced elevated API response times affecting some users.',
    'resolved',
    'minor',
    now() - interval '3 days',
    now() - interval '3 days' + interval '45 minutes'
  ),
  (
    'Scheduled Maintenance',
    'Scheduled database maintenance for performance improvements.',
    'resolved',
    'minor',
    now() - interval '7 days',
    now() - interval '7 days' + interval '30 minutes'
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_incidents_status ON system_incidents(status);
CREATE INDEX IF NOT EXISTS idx_system_incidents_started_at ON system_incidents(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS idx_status_subscribers_email ON status_subscribers(email);
