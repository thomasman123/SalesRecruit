-- Fix infinite recursion in users table RLS policies and ensure jobs are visible
-- This migration addresses two issues:
-- 1. "infinite recursion detected in policy for relation 'users'"
-- 2. No jobs showing in opportunities page

-- First, drop all existing policies on users table to eliminate recursion
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

-- Create clean policies for users table without any recursion
-- These policies avoid EXISTS clauses that reference the users table itself

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Authenticated users can view all users
-- This is needed for features like job applications, invitations, messaging, etc.
CREATE POLICY "Authenticated users can view all users"
ON public.users
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Now fix the jobs table policies
-- Drop existing policies that might be problematic
DROP POLICY IF EXISTS "Everyone can view active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can manage their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can manage their own jobs or admins can manage all" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters and admins can view applicants" ON public.jobs;
DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.jobs;

-- Create clean policies for jobs table

-- Policy 1: All authenticated users can view active jobs
CREATE POLICY "Authenticated users can view active jobs"
ON public.jobs
FOR SELECT
USING (
  status = 'active' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Recruiters can view all their own jobs (any status)
CREATE POLICY "Recruiters can view own jobs"
ON public.jobs
FOR SELECT
USING (auth.uid() = recruiter_id);

-- Policy 3: Recruiters can insert jobs
CREATE POLICY "Recruiters can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (auth.uid() = recruiter_id);

-- Policy 4: Recruiters can update their own jobs
CREATE POLICY "Recruiters can update own jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = recruiter_id)
WITH CHECK (auth.uid() = recruiter_id);

-- Policy 5: Recruiters can delete their own jobs
CREATE POLICY "Recruiters can delete own jobs"
ON public.jobs
FOR DELETE
USING (auth.uid() = recruiter_id);

-- Policy 6: Admins can do everything with jobs (simplified without recursion)
CREATE POLICY "Admins have full access to jobs"
ON public.jobs
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  )
);

-- Ensure country column exists on jobs table (for filtering)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'jobs' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE public.jobs 
    ADD COLUMN country TEXT DEFAULT 'United States';
  END IF;
END $$;

-- Add some diagnostic output
DO $$
DECLARE
  job_count INTEGER;
  active_job_count INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(CASE WHEN status = 'active' THEN 1 END) 
  INTO job_count, active_job_count
  FROM public.jobs;
  
  RAISE NOTICE 'Total jobs in database: %, Active jobs: %', job_count, active_job_count;
END $$; 