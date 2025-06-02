-- Fix for application errors with activity log handling
-- This handles the activity_logs constraint issue

-- 1. First, temporarily disable the job activity trigger
ALTER TABLE public.jobs DISABLE TRIGGER log_job_activity_trigger;

-- 2. Update the job status
UPDATE public.jobs 
SET status = 'active' 
WHERE id = 37;

-- 3. Re-enable the trigger
ALTER TABLE public.jobs ENABLE TRIGGER log_job_activity_trigger;

-- 4. Drop existing applicant policies
DROP POLICY IF EXISTS "Sales professionals can apply to jobs" ON public.applicants;
DROP POLICY IF EXISTS "Sales professionals can view their own applications" ON public.applicants;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.applicants;
DROP POLICY IF EXISTS "Anyone authenticated can apply" ON public.applicants;
DROP POLICY IF EXISTS "Anyone can view applications" ON public.applicants;

-- 5. Create simple policies for applicants
CREATE POLICY "Authenticated users can apply"
ON public.applicants
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view applications"
ON public.applicants
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own applications"
ON public.applicants
FOR UPDATE
USING (
    user_id = auth.uid() 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 6. Success message
DO $$
BEGIN
    RAISE NOTICE 'Job 37 activated without triggering activity log!';
    RAISE NOTICE 'Application policies have been simplified.';
    RAISE NOTICE 'You should now be able to apply to the job.';
END $$; 