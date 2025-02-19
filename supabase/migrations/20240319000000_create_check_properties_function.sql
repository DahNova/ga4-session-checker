-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to check properties
CREATE OR REPLACE FUNCTION public.check_properties()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the Next.js API endpoint to check properties
  PERFORM net.http_post(
    url := 'http://localhost:3000/api/cron/check-properties',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
END;
$$;

-- Function to manage schedules
CREATE OR REPLACE FUNCTION public.manage_check_schedules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  cron_expression TEXT;
  job_name TEXT;
BEGIN
  -- First, disable all existing check-properties jobs
  PERFORM cron.unschedule('check-properties-%');
  
  -- Get all users with their settings
  FOR user_record IN 
    SELECT 
      u.id,
      s.check_frequency,
      s.check_time,
      s.custom_cron,
      s.time_zone
    FROM users u
    JOIN settings s ON s.user_id = u.id
  LOOP
    -- Generate job name for this user
    job_name := 'check-properties-' || user_record.id;
    
    -- Determine cron expression based on settings
    CASE user_record.check_frequency
      WHEN 'hourly' THEN
        cron_expression := '0 * * * *'; -- Every hour at minute 0
      WHEN 'daily' THEN
        -- Extract hour and minute from check_time (format: HH:MM)
        cron_expression := format('0 %s * * *', 
          REPLACE(user_record.check_time, ':', ' ')
        );
      WHEN 'custom' THEN
        cron_expression := user_record.custom_cron;
      ELSE
        CONTINUE; -- Skip invalid frequencies
    END CASE;
    
    -- Schedule the job with the determined cron expression
    PERFORM cron.schedule(
      job_name,
      cron_expression,
      'SELECT check_properties();'
    );
  END LOOP;
END;
$$; 