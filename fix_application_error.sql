-- Fix application error for sales professionals
-- Run this in your production Supabase SQL Editor

-- 1. First ensure all auth users have corresponding public.users records
INSERT INTO public.users (id, email, name, role, onboarded)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as name,
    COALESCE(au.raw_user_meta_data->>'role', 'sales-professional') as role,
    COALESCE((au.raw_user_meta_data->>'onboarded')::boolean, TRUE) as onboarded
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 2. Update the sales professional application policy to be more robust
DROP POLICY IF EXISTS "Sales professionals can apply to jobs" ON public.applicants;

CREATE POLICY "Sales professionals can apply to jobs"
ON public.applicants
FOR INSERT
WITH CHECK (
    -- Check if the user is authenticated
    auth.uid() IS NOT NULL 
    AND
    -- Either the email matches the auth user's email
    (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND
    -- And user_id is either the authenticated user or NULL
    (user_id = auth.uid() OR user_id IS NULL)
);

-- 3. Also create a more permissive view policy
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

-- 4. Ensure the applicants table has proper constraints
-- Check if user_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'applicants' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.applicants ADD COLUMN user_id UUID REFERENCES public.users(id);
    END IF;
END $$;

-- 5. Verify the fix
SELECT 
    COUNT(*) as missing_users,
    'Users in auth but not in public.users' as description
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL

UNION ALL

SELECT 
    COUNT(*) as policy_count,
    'Applicant insert policies' as description
FROM pg_policies 
WHERE tablename = 'applicants' 
AND policyname LIKE '%apply%';

-- 6. Test message
DO $$
BEGIN
    RAISE NOTICE 'Application policies have been updated!';
    RAISE NOTICE 'Sales professionals should now be able to apply to jobs.';
END $$; 