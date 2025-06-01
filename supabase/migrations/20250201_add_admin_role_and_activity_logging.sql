-- Add admin role and comprehensive activity logging system

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
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX idx_activity_logs_user_role ON public.activity_logs(user_role);

-- 3. Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for activity_logs
-- Admins can see all activity logs
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

-- Users can see their own activity
CREATE POLICY "Users can view their own activity"
ON public.activity_logs
FOR SELECT
USING (user_id = auth.uid());

-- Service role can insert activity logs
CREATE POLICY "Service role can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- 5. Update all existing RLS policies to include admin access

-- Update users table policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data or admins can view all"
ON public.users
FOR SELECT
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Update jobs table policies
DROP POLICY IF EXISTS "Recruiters can manage their own jobs" ON public.jobs;
CREATE POLICY "Recruiters can manage their own jobs or admins can manage all"
ON public.jobs
FOR ALL
USING (
  auth.uid() = recruiter_id 
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Update applicants policies to include admin access
DROP POLICY IF EXISTS "Recruiters can view applicants for their jobs" ON public.applicants;
DROP POLICY IF EXISTS "Recruiters can manage applicants for their jobs" ON public.applicants;

CREATE POLICY "Recruiters and admins can view applicants"
ON public.applicants
FOR SELECT
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Recruiters and admins can manage applicants"
ON public.applicants
FOR ALL
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Update conversations policies
DROP POLICY IF EXISTS "Participants can manage their conversations" ON public.conversations;
CREATE POLICY "Participants and admins can manage conversations"
ON public.conversations
FOR ALL
USING (
  recruiter_id = auth.uid() 
  OR applicant_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Update messages policies
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Participants can insert messages in their conversations" ON public.messages;

CREATE POLICY "Participants and admins can view messages"
ON public.messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.conversations 
    WHERE recruiter_id = auth.uid() 
    OR applicant_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Participants and admins can insert messages"
ON public.messages
FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations 
    WHERE recruiter_id = auth.uid() 
    OR applicant_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Update notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications or admins can view all"
ON public.notifications
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Update scheduled_interviews policies
DROP POLICY IF EXISTS "Recruiters can view interviews for their jobs" ON public.scheduled_interviews;
DROP POLICY IF EXISTS "Sales reps can view their own interviews" ON public.scheduled_interviews;

CREATE POLICY "Users and admins can view interviews"
ON public.scheduled_interviews
FOR SELECT
USING (
  sales_rep_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = scheduled_interviews.job_id 
    AND jobs.recruiter_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 6. Create function to log activities
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

-- 7. Create triggers to automatically log certain activities

-- Log job creation/updates
CREATE OR REPLACE FUNCTION log_job_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity('created', 'job', NEW.id::TEXT, 
      jsonb_build_object('title', NEW.title, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity('updated', 'job', NEW.id::TEXT,
      jsonb_build_object('title', NEW.title, 'status', NEW.status, 
        'old_status', OLD.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_job_activity_trigger
AFTER INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION log_job_activity();

-- Log applicant activity
CREATE OR REPLACE FUNCTION log_applicant_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity('applied', 'applicant', NEW.id::TEXT,
      jsonb_build_object('job_id', NEW.job_id, 'name', NEW.name));
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_activity('status_changed', 'applicant', NEW.id::TEXT,
      jsonb_build_object('job_id', NEW.job_id, 'name', NEW.name,
        'old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_applicant_activity_trigger
AFTER INSERT OR UPDATE ON public.applicants
FOR EACH ROW EXECUTE FUNCTION log_applicant_activity();

-- Log message activity
CREATE OR REPLACE FUNCTION log_message_activity()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity('sent_message', 'message', NEW.id::TEXT,
    jsonb_build_object('conversation_id', NEW.conversation_id,
      'sender_type', NEW.sender_type));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_message_activity_trigger
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION log_message_activity();

-- Log interview scheduling
CREATE OR REPLACE FUNCTION log_interview_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity('scheduled_interview', 'interview', NEW.id::TEXT,
      jsonb_build_object('job_id', NEW.job_id, 'applicant_id', NEW.applicant_id,
        'scheduled_date', NEW.scheduled_date, 'scheduled_time', NEW.scheduled_time));
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_activity('interview_status_changed', 'interview', NEW.id::TEXT,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_interview_activity_trigger
AFTER INSERT OR UPDATE ON public.scheduled_interviews
FOR EACH ROW EXECUTE FUNCTION log_interview_activity();

-- 8. Update triggers to handle admin role in availability
-- Update the function that checks roles for calendar availability
CREATE OR REPLACE FUNCTION add_default_availability_for_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Add availability for recruiters, sales professionals, and admins
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role IN ('recruiter', 'sales-professional', 'admin')
  ) THEN
    -- Insert default availability (Monday-Friday 9AM-5PM, weekends off)
    INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
    VALUES
      (user_id, 0, '09:00:00', '17:00:00', false), -- Sunday
      (user_id, 1, '09:00:00', '17:00:00', true),  -- Monday
      (user_id, 2, '09:00:00', '17:00:00', true),  -- Tuesday
      (user_id, 3, '09:00:00', '17:00:00', true),  -- Wednesday
      (user_id, 4, '09:00:00', '17:00:00', true),  -- Thursday
      (user_id, 5, '09:00:00', '17:00:00', true),  -- Friday
      (user_id, 6, '09:00:00', '17:00:00', false)  -- Saturday
    ON CONFLICT (user_id, day_of_week) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update role change trigger to include admin
CREATE OR REPLACE FUNCTION update_availability_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role changed to recruiter, sales-professional, or admin
  IF NEW.role IN ('recruiter', 'sales-professional', 'admin') 
     AND (OLD.role IS NULL OR OLD.role NOT IN ('recruiter', 'sales-professional', 'admin')) THEN
    PERFORM add_default_availability_for_user(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Add calendar availability policies for admins
CREATE POLICY "Admins can view all calendar availability"
ON public.calendar_availability
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage all calendar availability"
ON public.calendar_availability
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 10. Create a view for admins to see user activity summary
CREATE OR REPLACE VIEW admin_user_activity_summary AS
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

-- Grant access to the view
GRANT SELECT ON admin_user_activity_summary TO authenticated;

-- 11. Create admin dashboard stats view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.users WHERE role = 'recruiter') as total_recruiters,
  (SELECT COUNT(*) FROM public.users WHERE role = 'sales-professional') as total_sales_professionals,
  (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'active') as active_jobs,
  (SELECT COUNT(*) FROM public.applicants) as total_applicants,
  (SELECT COUNT(*) FROM public.scheduled_interviews WHERE scheduled_date >= CURRENT_DATE) as upcoming_interviews,
  (SELECT COUNT(*) FROM public.messages WHERE timestamp > NOW() - INTERVAL '24 hours') as messages_today,
  (SELECT COUNT(DISTINCT user_id) FROM public.activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') as active_users_today;

-- Grant access
GRANT SELECT ON admin_dashboard_stats TO authenticated; 