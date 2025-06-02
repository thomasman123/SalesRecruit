-- Check RLS policies that might be affecting the full_access column

-- 1. Check if RLS is enabled on the users table
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'users' 
AND relnamespace = 'public'::regnamespace;

-- 2. List all RLS policies on the users table
SELECT 
    pol.polname AS policy_name,
    pol.polcmd AS command,
    CASE pol.polcmd 
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command_type,
    pol.polroles::regrole[] AS roles,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression
FROM pg_policy pol
WHERE pol.polrelid = 'public.users'::regclass;

-- 3. Check current user permissions
SELECT current_user, current_setting('role') as current_role;

-- 4. Test if we can update full_access as the current user
-- This will help identify if it's a permission issue
SELECT 
    has_table_privilege('users', 'UPDATE') as can_update_table,
    has_column_privilege('users', 'full_access', 'UPDATE') as can_update_column; 