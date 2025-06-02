-- Check and fix profile update permissions
-- Run this in Supabase SQL Editor

-- 1. Check current RLS policies on users table
SELECT 
    polname AS policy_name,
    CASE polcmd 
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command_type,
    pg_get_expr(polqual, polrelid) AS using_expression,
    pg_get_expr(polwithcheck, polrelid) AS with_check_expression
FROM pg_policy
WHERE polrelid = 'public.users'::regclass
ORDER BY polname;

-- 2. Create or replace policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Grant necessary permissions
GRANT UPDATE (name, company) ON public.users TO authenticated;

-- 4. Test query - Check if a specific user can update their profile
-- Replace USER_ID with an actual user ID to test
-- SELECT 
--     id,
--     email,
--     name,
--     company,
--     full_access,
--     role
-- FROM public.users 
-- WHERE id = 'USER_ID'; 