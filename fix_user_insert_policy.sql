-- Fix user insert policy to allow trigger-based inserts
-- This is a simpler alternative that updates the existing policy

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;

-- Create a new policy that allows both user self-inserts and system inserts
CREATE POLICY "Allow user profile creation" ON public.users
FOR INSERT
WITH CHECK (
  -- Allow if the user is creating their own profile
  auth.uid() = id 
  OR 
  -- Allow if it's a system insert (when auth.uid() is null, like in triggers)
  auth.uid() IS NULL
);

-- Also ensure the update policy exists for users to update their own profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure the select policy exists
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add a general authenticated users can view all users policy for the app to work
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
CREATE POLICY "Authenticated users can view all users" ON public.users
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'User insert policy has been updated to allow trigger-based inserts';
  RAISE NOTICE 'This should fix the "Database error saving new user" issue';
END $$; 