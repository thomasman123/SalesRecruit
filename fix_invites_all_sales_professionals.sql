-- Permanent Fix for Interview Invites Visibility for ALL Sales Professionals
-- This script fixes the issue for everyone with the sales-professional role

-- 1. First, let's see how many sales professionals we have
SELECT COUNT(*) as sales_professional_count 
FROM users 
WHERE role = 'sales-professional';

-- 2. Enable RLS on notifications table (if not already enabled)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- 4. Create permanent RLS policies for notifications
-- These policies will work for ALL users forever
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- This allows the API (using service role) to create notifications
CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- 5. Ensure metadata column exists with proper type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN metadata JSONB DEFAULT '{}';
    
    CREATE INDEX IF NOT EXISTS idx_notifications_metadata 
    ON notifications USING gin(metadata);
  END IF;
END $$;

-- 6. Fix ALL existing interview invitations for ALL sales professionals
-- This updates any invitations that don't have proper metadata
UPDATE notifications n
SET metadata = jsonb_build_object(
  'type', 'interview_invitation',
  'jobId', COALESCE((metadata->>'jobId')::int, 0),
  'jobTitle', COALESCE(
    metadata->>'jobTitle',
    substring(n.title from 'Interview Invitation: (.+)'),
    'Unknown Position'
  ),
  'company', COALESCE(
    metadata->>'company',
    'Please contact recruiter for details'
  ),
  'priceRange', COALESCE(metadata->>'priceRange', 'Not specified'),
  'industry', COALESCE(metadata->>'industry', 'Not specified'),
  'remote', COALESCE((metadata->>'remote')::boolean, false),
  'commission', COALESCE(metadata->>'commission', 'Not specified'),
  'recruiterName', COALESCE(metadata->>'recruiterName', 'Recruiter'),
  'recruiterId', metadata->>'recruiterId',
  'applicantId', metadata->>'applicantId'
)
WHERE n.title LIKE '%Interview Invitation%'
AND EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = n.user_id 
  AND u.role = 'sales-professional'
)
AND (n.metadata IS NULL OR n.metadata = '{}' OR n.metadata->>'type' IS NULL);

-- 7. Create scheduled_interviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS scheduled_interviews (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id INTEGER REFERENCES applicants(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sales_rep_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'scheduled',
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_interview UNIQUE (job_id, applicant_id, scheduled_date, scheduled_time)
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_job_id ON scheduled_interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_applicant_id ON scheduled_interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_recruiter_id ON scheduled_interviews(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_sales_rep_id ON scheduled_interviews(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_scheduled_date ON scheduled_interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_status ON scheduled_interviews(status);

-- 9. Enable RLS on scheduled_interviews
ALTER TABLE scheduled_interviews ENABLE ROW LEVEL SECURITY;

-- 10. Drop existing policies for scheduled_interviews to ensure clean state
DROP POLICY IF EXISTS "Recruiters can view interviews for their jobs" ON scheduled_interviews;
DROP POLICY IF EXISTS "Sales reps can view their own interviews" ON scheduled_interviews;
DROP POLICY IF EXISTS "Sales reps can book interviews" ON scheduled_interviews;
DROP POLICY IF EXISTS "Users can update their own interviews" ON scheduled_interviews;

-- 11. Create permanent RLS policies for scheduled_interviews
-- Policy for recruiters to view interviews for their jobs
CREATE POLICY "Recruiters can view interviews for their jobs" 
ON scheduled_interviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = scheduled_interviews.job_id 
    AND jobs.recruiter_id = auth.uid()
  )
);

-- Policy for sales reps to view their own interviews
CREATE POLICY "Sales reps can view their own interviews" 
ON scheduled_interviews
FOR SELECT
USING (sales_rep_id = auth.uid());

-- Policy for sales reps to book interviews
CREATE POLICY "Sales reps can book interviews" 
ON scheduled_interviews
FOR INSERT
WITH CHECK (sales_rep_id = auth.uid());

-- Policy for users to update their own interviews
CREATE POLICY "Users can update their own interviews" 
ON scheduled_interviews
FOR UPDATE
USING (
  recruiter_id = auth.uid() 
  OR sales_rep_id = auth.uid()
);

-- 12. Create an index on users.role for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 13. Create an index on notifications.user_id for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 14. Summary report
WITH stats AS (
  SELECT 
    COUNT(DISTINCT u.id) as total_sales_professionals,
    COUNT(DISTINCT n.user_id) as sales_professionals_with_invites,
    COUNT(n.id) as total_invitations,
    SUM(CASE WHEN n.metadata IS NOT NULL AND n.metadata != '{}' THEN 1 ELSE 0 END) as invitations_with_metadata,
    SUM(CASE WHEN NOT n.read THEN 1 ELSE 0 END) as unread_invitations
  FROM users u
  LEFT JOIN notifications n ON u.id = n.user_id AND n.title LIKE '%Interview Invitation%'
  WHERE u.role = 'sales-professional'
)
SELECT 
  '=== INVITATION FIX SUMMARY ===' as report,
  total_sales_professionals || ' total sales professionals' as sales_professionals,
  sales_professionals_with_invites || ' have received invitations' as with_invites,
  total_invitations || ' total interview invitations' as total_invites,
  invitations_with_metadata || ' invitations now have proper metadata' as fixed_invites,
  unread_invitations || ' unread invitations' as unread
FROM stats;

-- 15. Verify RLS policies are working
SELECT 
  'Notifications RLS enabled: ' || 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications' AND rowsecurity = true) 
    THEN 'YES ✓' 
    ELSE 'NO ✗' 
  END as notifications_rls,
  'Scheduled Interviews RLS enabled: ' || 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'scheduled_interviews' AND rowsecurity = true) 
    THEN 'YES ✓' 
    ELSE 'NO ✗' 
  END as interviews_rls;

-- 16. Show all RLS policies for notifications
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Done! All sales professionals should now be able to see their interview invitations. 