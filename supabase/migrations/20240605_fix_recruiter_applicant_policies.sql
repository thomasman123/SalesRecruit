-- Fix RLS policies for applicants table to ensure recruiters can see applicants for their jobs
-- The previous migration only added sales professional policies but removed recruiter policies

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Recruiters can view applicants for their jobs" ON public.applicants;
DROP POLICY IF EXISTS "Recruiters can manage applicants for their jobs" ON public.applicants;
DROP POLICY IF EXISTS "Sales professionals can view their own applications" ON public.applicants;
DROP POLICY IF EXISTS "Sales professionals can apply to jobs" ON public.applicants;

-- Recreate recruiter policies (these are the main ones needed for the applicants page)
CREATE POLICY "Recruiters can view applicants for their jobs"
ON public.applicants
FOR SELECT
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
  )
);

CREATE POLICY "Recruiters can manage applicants for their jobs"
ON public.applicants
FOR ALL
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
  )
);

-- Recreate sales professional policies
CREATE POLICY "Sales professionals can view their own applications"
ON public.applicants
FOR SELECT
USING (
  -- Allow select if the user_id matches the authenticated user OR email matches (for backward compatibility)
  user_id = auth.uid() OR email = (SELECT email FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Sales professionals can apply to jobs"
ON public.applicants
FOR INSERT
WITH CHECK (
  -- Allow insert if the email matches the authenticated user's email from public.users
  -- and user_id is set to the authenticated user's id
  email = (SELECT email FROM public.users WHERE id = auth.uid()) AND
  (user_id = auth.uid() OR user_id IS NULL)
); 