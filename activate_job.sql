-- Activate your job and check job visibility
-- Replace job ID 37 with your actual job ID if different

-- 1. Check the current status of job 37
SELECT id, title, status, recruiter_id, created_at
FROM public.jobs 
WHERE id = 37;

-- 2. Activate the job (change from draft to active)
UPDATE public.jobs 
SET status = 'active' 
WHERE id = 37;

-- 3. Verify the job is now active and visible
SELECT 
    j.id,
    j.title,
    j.status,
    j.industry as type,
    j.price_range,
    j.lead_source,
    j.team_size,
    j.remote_compatible,
    u.email as recruiter_email
FROM public.jobs j
JOIN public.users u ON j.recruiter_id = u.id
WHERE j.id = 37;

-- 4. Check what jobs are visible to sales professionals
-- This simulates what a sales professional would see
SELECT COUNT(*) as active_jobs_count
FROM public.jobs
WHERE status = 'active';

-- Note: Jobs in 'draft' status are typically only visible to the recruiter who created them
-- Active jobs are visible to all users (recruiters and sales professionals) 