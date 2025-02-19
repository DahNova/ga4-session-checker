-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA public;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.update_check_schedules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call manage_check_schedules when settings change
  PERFORM manage_check_schedules();
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS settings_schedule_trigger ON public.settings;

-- Create trigger on settings table
CREATE TRIGGER settings_schedule_trigger
  AFTER INSERT OR UPDATE OF check_frequency, check_time, custom_cron, time_zone
  ON public.settings
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.update_check_schedules();

-- Function to manage schedules
CREATE OR REPLACE FUNCTION public.manage_check_schedules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  cron_expression TEXT;
  job_name TEXT;
  existing_job RECORD;
  users_count INTEGER;
BEGIN
  -- Log start of function
  RAISE NOTICE 'Starting manage_check_schedules()';

  -- First, find and disable all existing check-properties jobs
  FOR existing_job IN 
    SELECT jobid, jobname 
    FROM cron.job 
    WHERE jobname LIKE 'check-properties-%'
  LOOP
    RAISE NOTICE 'Unscheduling existing job: %', existing_job.jobname;
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;
  
  -- Count users with settings
  SELECT COUNT(*) INTO users_count
  FROM auth.users u
  JOIN public.settings s ON s.user_id = u.id;
  
  RAISE NOTICE 'Found % users with settings', users_count;
  
  -- Get all users with their settings
  FOR user_record IN 
    SELECT 
      u.id,
      s.check_frequency,
      s.check_time,
      s.custom_cron,
      s.time_zone
    FROM auth.users u
    JOIN public.settings s ON s.user_id = u.id
  LOOP
    -- Generate job name for this user
    job_name := 'check-properties-' || user_record.id;
    RAISE NOTICE 'Processing user %, frequency: %, time: %', 
      user_record.id, 
      user_record.check_frequency, 
      user_record.check_time;
    
    -- Determine cron expression based on settings
    CASE user_record.check_frequency::text
      WHEN 'hourly' THEN
        cron_expression := '0 * * * *'; -- Every hour at minute 0
      WHEN 'daily' THEN
        -- Extract hour and minute from check_time (format: HH:MM)
        cron_expression := format('0 %s * * *', 
          REPLACE(user_record.check_time::text, ':', ' ')
        );
      WHEN 'custom' THEN
        cron_expression := user_record.custom_cron;
      ELSE
        RAISE NOTICE 'Skipping invalid frequency: %', user_record.check_frequency;
        CONTINUE; -- Skip invalid frequencies
    END CASE;
    
    RAISE NOTICE 'Scheduling job % with cron expression: %', job_name, cron_expression;
    
    -- Schedule the job with the determined cron expression
    PERFORM cron.schedule(
      job_name,
      cron_expression,
      'SELECT public.check_properties();'
    );
  END LOOP;
  
  RAISE NOTICE 'Completed manage_check_schedules()';
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;

-- Check users and their settings
SELECT 
  u.id as user_id,
  u.email,
  s.check_frequency,
  s.check_time,
  s.custom_cron,
  s.time_zone
FROM auth.users u
LEFT JOIN public.settings s ON s.user_id = u.id;

-- Initial setup of schedules
SELECT public.manage_check_schedules();

-- Verify scheduled jobs
SELECT jobname, schedule, command, active 
FROM cron.job 
WHERE jobname LIKE 'check-properties-%'; 