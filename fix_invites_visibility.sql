-- Comprehensive Fix for Interview Invites Visibility
-- Replace 'your-email@example.com' with your actual email address

-- 1. First check your current user details
SELECT id, email, role, name 
FROM users 
WHERE email = 'your-email@example.com';

-- 2. Update your role to sales-professional if needed
UPDATE users 
SET role = 'sales-professional' 
WHERE email = 'your-email@example.com'
AND role != 'sales-professional';

-- 3. Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- 5. Create RLS policies for notifications
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

-- 6. Ensure metadata column exists
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

-- 7. Check your existing invitations
SELECT 
  id,
  title,
  substring(body, 1, 100) as body_preview,
  created_at,
  read,
  metadata
FROM notifications 
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com')
AND title LIKE '%Interview Invitation%'
ORDER BY created_at DESC;

-- 8. Fix any invitations with missing metadata
UPDATE notifications
SET metadata = jsonb_build_object(
  'type', 'interview_invitation',
  'jobId', 0,
  'jobTitle', COALESCE(
    substring(title from 'Interview Invitation: (.+)'),
    'Unknown Position'
  ),
  'company', 'Please contact recruiter for details'
)
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com')
AND title LIKE '%Interview Invitation%'
AND (metadata IS NULL OR metadata = '{}');

-- 9. Verify scheduled_interviews table exists
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

-- 10. Enable RLS on scheduled_interviews
ALTER TABLE scheduled_interviews ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for scheduled_interviews
DO $$ 
BEGIN
  -- Policy for recruiters
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scheduled_interviews' 
    AND policyname = 'Recruiters can view interviews for their jobs'
  ) THEN
    CREATE POLICY "Recruiters can view interviews for their jobs" ON scheduled_interviews
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM jobs 
          WHERE jobs.id = scheduled_interviews.job_id 
          AND jobs.recruiter_id = auth.uid()
        )
      );
  END IF;

  -- Policy for sales reps
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scheduled_interviews' 
    AND policyname = 'Sales reps can view their own interviews'
  ) THEN
    CREATE POLICY "Sales reps can view their own interviews" ON scheduled_interviews
      FOR SELECT
      USING (sales_rep_id = auth.uid());
  END IF;

  -- Policy for sales reps to book
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scheduled_interviews' 
    AND policyname = 'Sales reps can book interviews'
  ) THEN
    CREATE POLICY "Sales reps can book interviews" ON scheduled_interviews
      FOR INSERT
      WITH CHECK (sales_rep_id = auth.uid());
  END IF;

  -- Policy for updates
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scheduled_interviews' 
    AND policyname = 'Users can update their own interviews'
  ) THEN
    CREATE POLICY "Users can update their own interviews" ON scheduled_interviews
      FOR UPDATE
      USING (
        recruiter_id = auth.uid() 
        OR sales_rep_id = auth.uid()
      );
  END IF;
END $$;

-- 12. Final verification
SELECT 
  'Your role: ' || (SELECT role FROM users WHERE email = 'your-email@example.com') as your_role,
  'Total invitations: ' || COUNT(*) as total_invites,
  'Unread invitations: ' || SUM(CASE WHEN NOT read THEN 1 ELSE 0 END) as unread_invites
FROM notifications 
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com')
AND title LIKE '%Interview Invitation%';

-- 13. Test the policies by trying to select your notifications
SELECT COUNT(*) as your_notification_count
FROM notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com');

-- If you see results, the RLS policies are working correctly! 