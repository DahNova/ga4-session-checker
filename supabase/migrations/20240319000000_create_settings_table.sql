-- Create enum for check frequency
CREATE TYPE check_frequency_type AS ENUM ('hourly', 'daily', 'custom');

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Anomaly Detection
  anomaly_threshold FLOAT NOT NULL DEFAULT 0.5,
  min_sessions INTEGER NOT NULL DEFAULT 100,
  warning_severity FLOAT NOT NULL DEFAULT 0.3,
  critical_severity FLOAT NOT NULL DEFAULT 0.5,
  compare_with_days INTEGER NOT NULL DEFAULT 7,
  
  -- Schedule
  check_frequency check_frequency_type NOT NULL DEFAULT 'daily',
  custom_cron TEXT,
  check_time TIME NOT NULL DEFAULT '00:00',
  time_zone TEXT NOT NULL DEFAULT 'UTC',
  check_delay_seconds INTEGER NOT NULL DEFAULT 2,
  
  -- Notifications
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  email_addresses TEXT[] NOT NULL DEFAULT '{}',
  slack_webhook TEXT,
  telegram_chat_id TEXT,
  
  -- SMTP Settings
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT,
  smtp_password TEXT,
  smtp_from_email TEXT,
  smtp_from_name TEXT,
  
  -- Dashboard Preferences
  default_page_size INTEGER NOT NULL DEFAULT 25,
  default_sort_field TEXT NOT NULL DEFAULT 'name',
  default_sort_order TEXT NOT NULL DEFAULT 'asc',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_user_settings UNIQUE (user_id),
  CONSTRAINT valid_check_time CHECK (check_time::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT valid_custom_cron CHECK (
    custom_cron IS NULL OR 
    check_frequency != 'custom' OR 
    custom_cron ~ '^(\*|[0-9]|[1-5][0-9]) (\*|[0-9]|1[0-9]|2[0-3]) (\*|[1-9]|[12][0-9]|3[01]) (\*|[1-9]|1[0-2]) (\*|[0-6])$'
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at(); 