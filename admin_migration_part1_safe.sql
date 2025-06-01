-- Admin Migration Part 1: Core Admin Role and Activity Logging (SAFE VERSION)
-- This version checks for existing objects to avoid conflicts
-- Run this first in Supabase SQL Editor

-- 1. Update the role constraint on users table to include 'admin'
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('recruiter', 'sales-professional', 'admin'));

-- 2. Create activity_logs table to track all user actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  user_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_role ON public.activity_logs(user_role);

-- 3. Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies and create new ones for activity_logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view their own activity" ON public.activity_logs;
DROP POLICY IF EXISTS "Service role can insert activity logs" ON public.activity_logs;

CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Users can view their own activity"
ON public.activity_logs
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- 5. Create or replace the log_activity function
CREATE OR REPLACE FUNCTION log_activity(
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_email TEXT;
BEGIN
  -- Get current user info
  SELECT id, role, email INTO v_user_id, v_user_role, v_user_email
  FROM public.users
  WHERE id = auth.uid();

  -- Insert activity log
  INSERT INTO public.activity_logs (
    user_id, user_role, user_email, action_type, 
    entity_type, entity_id, metadata, ip_address, user_agent
  ) VALUES (
    v_user_id, v_user_role, v_user_email, p_action_type,
    p_entity_type, p_entity_id, p_metadata, p_ip_address, p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Drop and recreate admin views
DROP VIEW IF EXISTS admin_user_activity_summary;
DROP VIEW IF EXISTS admin_dashboard_stats;

CREATE VIEW admin_user_activity_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  u.role,
  COUNT(DISTINCT al.id) as total_actions,
  MAX(al.created_at) as last_activity,
  COUNT(DISTINCT CASE WHEN al.created_at > NOW() - INTERVAL '24 hours' THEN al.id END) as actions_today,
  COUNT(DISTINCT CASE WHEN al.created_at > NOW() - INTERVAL '7 days' THEN al.id END) as actions_this_week
FROM public.users u
LEFT JOIN public.activity_logs al ON al.user_id = u.id
GROUP BY u.id, u.email, u.name, u.role;

GRANT SELECT ON admin_user_activity_summary TO authenticated;

CREATE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.users WHERE role = 'recruiter') as total_recruiters,
  (SELECT COUNT(*) FROM public.users WHERE role = 'sales-professional') as total_sales_professionals,
  (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'active') as active_jobs,
  (SELECT COUNT(*) FROM public.applicants) as total_applicants,
  (SELECT COUNT(*) FROM public.scheduled_interviews WHERE scheduled_date >= CURRENT_DATE) as upcoming_interviews,
  (SELECT COUNT(*) FROM public.messages WHERE timestamp > NOW() - INTERVAL '24 hours') as messages_today,
  (SELECT COUNT(DISTINCT user_id) FROM public.activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') as active_users_today;

GRANT SELECT ON admin_dashboard_stats TO authenticated;

-- Done with Part 1!
SELECT 'Part 1 (SAFE VERSION) completed successfully!' as status; 