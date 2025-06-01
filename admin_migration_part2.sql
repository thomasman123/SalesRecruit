-- Admin Migration Part 2: Update RLS Policies
-- Run this after Part 1 in Supabase SQL Editor

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

-- Update applicants policies
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

-- Add calendar availability policies for admins
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

-- Done with Part 2!
SELECT 'Part 2 completed successfully!' as status; 