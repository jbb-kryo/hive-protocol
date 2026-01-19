/*
  # Update Tool Configuration Fields

  1. Updates
    - Web Search: search provider, result count, safe search
    - Web Browser: JavaScript enabled, timeout, user agent
    - Code Executor: languages, timeout, memory limit
    - File Operations: allowed paths, max file size
    - Database Query: connection string, database type, allowed operations
    - Email Sender: SMTP/API provider settings
    - Calendar Manager: provider, API key, default calendar
    - Image Generator: provider, API key, default size

  2. Changes
    - Updates capabilities jsonb for each system tool with detailed config_fields
*/

UPDATE tools
SET capabilities = '{
  "category": "Research",
  "requires_config": true,
  "config_fields": [
    {"name": "provider", "type": "select", "label": "Search Provider", "required": true, "options": ["Google", "Bing", "DuckDuckGo", "Brave"]},
    {"name": "result_count", "type": "number", "label": "Results Per Query", "required": true, "default": 10, "min": 1, "max": 50},
    {"name": "safe_search", "type": "select", "label": "Safe Search", "required": false, "options": ["Off", "Moderate", "Strict"], "default": "Moderate"},
    {"name": "api_key", "type": "password", "label": "API Key (if required)", "required": false}
  ]
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE tools
SET capabilities = '{
  "category": "Research",
  "requires_config": true,
  "config_fields": [
    {"name": "javascript_enabled", "type": "toggle", "label": "Enable JavaScript", "required": false, "default": true},
    {"name": "timeout", "type": "number", "label": "Page Load Timeout (seconds)", "required": true, "default": 30, "min": 5, "max": 120},
    {"name": "user_agent", "type": "select", "label": "User Agent", "required": false, "options": ["Chrome Desktop", "Firefox Desktop", "Safari Desktop", "Chrome Mobile", "Safari Mobile"], "default": "Chrome Desktop"},
    {"name": "screenshot_enabled", "type": "toggle", "label": "Enable Screenshots", "required": false, "default": true}
  ]
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE tools
SET capabilities = '{
  "category": "Development",
  "requires_config": true,
  "config_fields": [
    {"name": "languages", "type": "multiselect", "label": "Enabled Languages", "required": true, "options": ["Python", "JavaScript", "TypeScript", "Ruby", "Go", "Rust", "Java", "C++", "Shell"], "default": ["Python", "JavaScript"]},
    {"name": "timeout", "type": "number", "label": "Execution Timeout (seconds)", "required": true, "default": 30, "min": 5, "max": 300},
    {"name": "memory_limit", "type": "select", "label": "Memory Limit", "required": true, "options": ["128 MB", "256 MB", "512 MB", "1 GB", "2 GB"], "default": "256 MB"},
    {"name": "network_access", "type": "toggle", "label": "Allow Network Access", "required": false, "default": false}
  ]
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000003';

UPDATE tools
SET capabilities = '{
  "category": "Development",
  "requires_config": true,
  "config_fields": [
    {"name": "allowed_paths", "type": "text", "label": "Allowed Paths (comma-separated)", "required": true, "default": "/tmp,/home/user/workspace", "placeholder": "/path1,/path2"},
    {"name": "max_file_size", "type": "select", "label": "Max File Size", "required": true, "options": ["1 MB", "5 MB", "10 MB", "50 MB", "100 MB"], "default": "10 MB"},
    {"name": "allowed_extensions", "type": "text", "label": "Allowed Extensions (comma-separated)", "required": false, "placeholder": ".txt,.json,.md,.py,.js"},
    {"name": "allow_delete", "type": "toggle", "label": "Allow File Deletion", "required": false, "default": false}
  ]
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000004';

UPDATE tools
SET capabilities = '{
  "category": "Data",
  "requires_config": true,
  "config_fields": [
    {"name": "database_type", "type": "select", "label": "Database Type", "required": true, "options": ["PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis"]},
    {"name": "connection_string", "type": "password", "label": "Connection String", "required": true, "placeholder": "postgresql://user:pass@host:5432/db"},
    {"name": "allowed_operations", "type": "multiselect", "label": "Allowed Operations", "required": true, "options": ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP"], "default": ["SELECT"]},
    {"name": "query_timeout", "type": "number", "label": "Query Timeout (seconds)", "required": true, "default": 30, "min": 5, "max": 300},
    {"name": "max_rows", "type": "number", "label": "Max Rows Returned", "required": true, "default": 1000, "min": 1, "max": 10000}
  ]
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000005';

UPDATE tools
SET capabilities = '{
  "category": "Communication",
  "requires_config": true,
  "config_fields": [
    {"name": "provider", "type": "select", "label": "Email Provider", "required": true, "options": ["SMTP", "SendGrid", "Mailgun", "AWS SES", "Postmark"]},
    {"name": "smtp_host", "type": "text", "label": "SMTP Host", "required": false, "placeholder": "smtp.example.com", "show_if": {"field": "provider", "value": "SMTP"}},
    {"name": "smtp_port", "type": "number", "label": "SMTP Port", "required": false, "default": 587, "show_if": {"field": "provider", "value": "SMTP"}},
    {"name": "smtp_user", "type": "text", "label": "SMTP Username", "required": false, "show_if": {"field": "provider", "value": "SMTP"}},
    {"name": "smtp_password", "type": "password", "label": "SMTP Password", "required": false, "show_if": {"field": "provider", "value": "SMTP"}},
    {"name": "api_key", "type": "password", "label": "API Key", "required": false, "show_if": {"field": "provider", "value": ["SendGrid", "Mailgun", "AWS SES", "Postmark"]}},
    {"name": "from_email", "type": "text", "label": "Default From Email", "required": true, "placeholder": "noreply@example.com"},
    {"name": "from_name", "type": "text", "label": "Default From Name", "required": false, "placeholder": "HIVE Notifications"}
  ]
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000006';

UPDATE tools
SET capabilities = '{
  "category": "Productivity",
  "requires_config": true,
  "config_fields": [
    {"name": "provider", "type": "select", "label": "Calendar Provider", "required": true, "options": ["Google Calendar", "Microsoft Outlook", "Apple Calendar", "CalDAV"]},
    {"name": "api_key", "type": "password", "label": "API Key / OAuth Token", "required": true},
    {"name": "calendar_id", "type": "text", "label": "Default Calendar ID", "required": false, "placeholder": "primary"},
    {"name": "timezone", "type": "select", "label": "Default Timezone", "required": true, "options": ["UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney"], "default": "UTC"},
    {"name": "reminder_default", "type": "number", "label": "Default Reminder (minutes)", "required": false, "default": 30, "min": 0, "max": 1440}
  ]
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000007';

UPDATE tools
SET capabilities = '{
  "category": "Creative",
  "requires_config": true,
  "config_fields": [
    {"name": "provider", "type": "select", "label": "Image Provider", "required": true, "options": ["DALL-E 3", "DALL-E 2", "Stable Diffusion XL", "Stable Diffusion 3", "Midjourney"]},
    {"name": "api_key", "type": "password", "label": "API Key", "required": true},
    {"name": "default_size", "type": "select", "label": "Default Image Size", "required": true, "options": ["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"], "default": "1024x1024"},
    {"name": "default_quality", "type": "select", "label": "Default Quality", "required": false, "options": ["standard", "hd"], "default": "standard"},
    {"name": "default_style", "type": "select", "label": "Default Style", "required": false, "options": ["vivid", "natural"], "default": "vivid"}
  ]
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000008';
