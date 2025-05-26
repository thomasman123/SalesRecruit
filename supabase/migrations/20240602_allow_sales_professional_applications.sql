-- Allow sales professionals to insert their own applications
-- This policy allows authenticated users to insert applicant records where the email matches their auth email

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Sales professionals can apply to jobs" ON public.applicants;

CREATE POLICY "Sales professionals can apply to jobs"
ON public.applicants
FOR INSERT
WITH CHECK (
  -- Allow insert if the email matches the authenticated user's email from public.users
  email = (SELECT email FROM public.users WHERE id = auth.uid())
);

-- Also allow sales professionals to view their own applications
-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Sales professionals can view their own applications" ON public.applicants;

CREATE POLICY "Sales professionals can view their own applications"
ON public.applicants
FOR SELECT
USING (
  -- Allow select if the email matches the authenticated user's email from public.users
  email = (SELECT email FROM public.users WHERE id = auth.uid())
); 