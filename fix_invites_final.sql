-- Final Fix for Interview Invites Page
-- Replace 'your-email@example.com' with your actual email address throughout this script

-- 1. Update your role to sales-professional
UPDATE users 
SET role = 'sales-professional' 
WHERE email = 'your-email@example.com'
AND role != 'sales-professional';

-- 2. Check if the update worked
SELECT id, email, role, name 
FROM users 
WHERE email = 'your-email@example.com';

-- 3. Create scheduled_interviews table if it doesn't exist
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

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_job_id ON scheduled_interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_applicant_id ON scheduled_interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_recruiter_id ON scheduled_interviews(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_sales_rep_id ON scheduled_interviews(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_scheduled_date ON scheduled_interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_status ON scheduled_interviews(status);

-- 5. Enable RLS on scheduled_interviews
ALTER TABLE scheduled_interviews ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (with checks to avoid duplicates)
DO $$ 
BEGIN
  -- Policy for recruiters to view interviews
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

  -- Policy for sales reps to view their own interviews
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scheduled_interviews' 
    AND policyname = 'Sales reps can view their own interviews'
  ) THEN
    CREATE POLICY "Sales reps can view their own interviews" ON scheduled_interviews
      FOR SELECT
      USING (sales_rep_id = auth.uid());
  END IF;

  -- Policy for sales reps to book interviews
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

-- 7. Check interview invitation notifications
SELECT 
  COUNT(*) as total_invites,
  SUM(CASE WHEN metadata IS NULL THEN 1 ELSE 0 END) as missing_metadata,
  SUM(CASE WHEN metadata->>'jobId' IS NULL THEN 1 ELSE 0 END) as missing_job_id
FROM notifications 
WHERE title LIKE '%Interview Invitation%';

-- 8. Final verification
SELECT 
  'Setup complete!' as message,
  (SELECT role FROM users WHERE email = 'your-email@example.com') as your_role,
  EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'scheduled_interviews') as has_interviews_table,
  (SELECT COUNT(*) FROM notifications WHERE title LIKE '%Interview Invitation%' AND user_id = (SELECT id FROM users WHERE email = 'your-email@example.com')) as your_invites_count; 