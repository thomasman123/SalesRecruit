-- Simple fix for application error (avoids calendar availability issues)
-- Run this as an alternative to fix_application_error.sql

-- 1. Just update the RLS policies without inserting users
DROP POLICY IF EXISTS "Sales professionals can apply to jobs" ON public.applicants;

CREATE POLICY "Sales professionals can apply to jobs"
ON public.applicants
FOR INSERT
WITH CHECK (
    -- Check if the user is authenticated
    auth.uid() IS NOT NULL 
    AND
    -- Either the email matches the auth user's email (from auth.users, not public.users)
    (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND
    -- And user_id is either the authenticated user or NULL
    (user_id = auth.uid() OR user_id IS NULL)
);

-- 2. Update view policy
DROP POLICY IF EXISTS "Sales professionals can view their own applications" ON public.applicants;

CREATE POLICY "Sales professionals can view their own applications"
ON public.applicants
FOR SELECT
USING (
    -- Allow viewing if user_id matches
    user_id = auth.uid() 
    OR 
    -- Or email matches the auth user's email
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 3. Manually insert just YOUR user to avoid bulk insert issues
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.users (id, email, name, role, onboarded)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'role', 'sales-professional'),
    TRUE
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE SET
    onboarded = TRUE;

-- 4. Success message
DO $$
BEGIN
    RAISE NOTICE 'Application policies updated successfully!';
    RAISE NOTICE 'Remember to replace the email address with your actual email.';
END $$; 