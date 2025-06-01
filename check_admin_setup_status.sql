-- Check Admin Setup Status
-- Run this to see what's already been set up

-- Check if admin role is enabled
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND conname = 'users_role_check';

-- Check if activity_logs table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'activity_logs'
) as activity_logs_table_exists;

-- Check existing policies on activity_logs
SELECT 
  polname as policy_name,
  CASE polcmd 
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as operation
FROM pg_policy 
WHERE polrelid = 'public.activity_logs'::regclass;

-- Check if admin views exist
SELECT 
  viewname,
  EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = viewname
  ) as exists
FROM (VALUES 
  ('admin_user_activity_summary'),
  ('admin_dashboard_stats')
) AS v(viewname);

-- Check current admin users
SELECT email, role 
FROM public.users 
WHERE role = 'admin';

-- Summary
SELECT 'Run admin_migration_part1_safe.sql to continue setup' as next_step; 