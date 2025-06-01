-- Fix infinite recursion in users table RLS policies and jobs visibility issues

-- 1. First, let's check and drop all existing policies on users table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END $$;

-- 2. Create proper policies for users table without recursion
-- Allow users to view their own data
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to view basic info of all users (needed for job applications, messaging, etc)
CREATE POLICY "Authenticated users can view all users"
ON public.users
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Fix jobs table policies to ensure they're visible
-- Drop existing policies first
DROP POLICY IF EXISTS "Everyone can view active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can manage their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can manage their own jobs or admins can manage all" ON public.jobs;

-- Create policy to allow all authenticated users to view active jobs
CREATE POLICY "Everyone can view active jobs"
ON public.jobs
FOR SELECT
USING (status = 'active' AND auth.role() = 'authenticated');

-- Create policy for recruiters to manage their own jobs
CREATE POLICY "Recruiters can manage their own jobs"
ON public.jobs
FOR ALL
USING (auth.uid() = recruiter_id);

-- Create policy for admins to manage all jobs (without recursion)
CREATE POLICY "Admins can manage all jobs"
ON public.jobs
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- 4. Verify the jobs table has data
SELECT 
  'Jobs table check:' as info,
  COUNT(*) as total_jobs,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs
FROM public.jobs;

-- 5. Test if current user can see jobs
SELECT 
  'Current user job visibility test:' as info,
  COUNT(*) as visible_jobs
FROM public.jobs
WHERE status = 'active';

-- 6. Show all policies after fix
SELECT 
  'USERS TABLE POLICIES:' as table_info,
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
UNION ALL
SELECT 
  'JOBS TABLE POLICIES:' as table_info,
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'jobs' AND schemaname = 'public'
ORDER BY table_info, policyname; 