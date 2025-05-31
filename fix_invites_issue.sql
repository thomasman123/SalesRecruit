-- Fix Invites Page Issues

-- 0. First, let's check what columns exist in the jobs table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1. First, check your current user details
-- Replace 'your-email@example.com' with your actual email
SELECT id, email, role, name 
FROM users 
WHERE email = 'your-email@example.com';

-- 2. Update your role to sales-professional if needed
-- Replace 'your-email@example.com' with your actual email
UPDATE users 
SET role = 'sales-professional' 
WHERE email = 'your-email@example.com'
AND role != 'sales-professional';

-- 3. Check for problematic notifications
SELECT 
  COUNT(*) as total_invites,
  SUM(CASE WHEN metadata IS NULL THEN 1 ELSE 0 END) as missing_metadata,
  SUM(CASE WHEN metadata->>'jobId' IS NULL THEN 1 ELSE 0 END) as missing_job_id,
  SUM(CASE WHEN metadata->>'applicantId' IS NULL THEN 1 ELSE 0 END) as missing_applicant_id
FROM notifications 
WHERE title LIKE '%Interview Invitation%';

-- 4. View sample of problematic notifications
SELECT id, title, substring(body, 1, 100) as body_preview, metadata
FROM notifications 
WHERE title LIKE '%Interview Invitation%'
AND (
  metadata IS NULL 
  OR metadata->>'jobId' IS NULL
  OR metadata->>'applicantId' IS NULL
)
LIMIT 5;

-- 5. Optional: Clean up notifications with incomplete data
-- Uncomment the following lines if you want to delete bad notifications
/*
DELETE FROM notifications 
WHERE title LIKE '%Interview Invitation%'
AND (
  metadata IS NULL 
  OR metadata->>'jobId' IS NULL
  OR metadata->>'applicantId' IS NULL
  OR metadata->>'recruiterId' IS NULL
);
*/

-- 6. Verify the fix worked
SELECT 
  'Your role is now: ' || role as status,
  'You have ' || COUNT(n.*) || ' valid interview invitations' as invites_count
FROM users u
LEFT JOIN notifications n ON n.user_id = u.id 
  AND n.title LIKE '%Interview Invitation%'
  AND n.metadata IS NOT NULL
  AND n.metadata->>'jobId' IS NOT NULL
WHERE u.email = 'your-email@example.com'
GROUP BY u.role;

-- 7. Create scheduled_interviews table if it doesn't exist
-- This table is needed for booking interviews

-- First, check if company_overview column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' 
    AND column_name = 'company_overview'
  ) THEN
    ALTER TABLE jobs ADD COLUMN company_overview TEXT;
  END IF;
END $$;

-- Now create the scheduled_interviews table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_job_id ON scheduled_interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_applicant_id ON scheduled_interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_recruiter_id ON scheduled_interviews(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_sales_rep_id ON scheduled_interviews(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_scheduled_date ON scheduled_interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_status ON scheduled_interviews(status);

-- Add RLS policies
ALTER TABLE scheduled_interviews ENABLE ROW LEVEL SECURITY;

-- Policy for recruiters to see all interviews for their jobs
DO $$ 
BEGIN
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
END $$;

-- Policy for sales reps to see their own interviews
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scheduled_interviews' 
    AND policyname = 'Sales reps can view their own interviews'
  ) THEN
    CREATE POLICY "Sales reps can view their own interviews" ON scheduled_interviews
      FOR SELECT
      USING (sales_rep_id = auth.uid());
  END IF;
END $$;

-- Policy for sales reps to create interviews when booking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scheduled_interviews' 
    AND policyname = 'Sales reps can book interviews'
  ) THEN
    CREATE POLICY "Sales reps can book interviews" ON scheduled_interviews
      FOR INSERT
      WITH CHECK (sales_rep_id = auth.uid());
  END IF;
END $$;

-- 8. Final verification
SELECT 
  'Setup complete!' as message,
  EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'scheduled_interviews') as has_interviews_table; 