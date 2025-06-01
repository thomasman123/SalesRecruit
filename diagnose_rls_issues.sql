-- Diagnostic script to identify RLS policy issues

-- 1. Show all current policies on users table
SELECT 
  'CURRENT USERS POLICIES:' as section,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- 2. Show all current policies on jobs table
SELECT 
  'CURRENT JOBS POLICIES:' as section,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'jobs' AND schemaname = 'public'
ORDER BY policyname;

-- 3. Check for policies that might cause recursion (looking for circular references)
SELECT 
  'POTENTIAL RECURSIVE POLICIES:' as section,
  schemaname,
  tablename,
  policyname,
  qual as policy_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%EXISTS%SELECT%FROM%' || tablename || '%'
ORDER BY tablename, policyname;

-- 4. Check job data
SELECT 
  'JOB DATA CHECK:' as section,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_jobs,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_jobs,
  COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_jobs
FROM public.jobs;

-- 5. Check if RLS is enabled
SELECT 
  'RLS STATUS:' as section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'jobs', 'applicants')
ORDER BY tablename;

-- 6. Test current user access
DO $$
DECLARE
  user_id uuid;
  user_role text;
BEGIN
  -- Get current user info
  user_id := auth.uid();
  
  IF user_id IS NOT NULL THEN
    SELECT role INTO user_role FROM public.users WHERE id = user_id;
    RAISE NOTICE 'Current user ID: %, Role: %', user_id, user_role;
  ELSE
    RAISE NOTICE 'No authenticated user found';
  END IF;
END $$; 