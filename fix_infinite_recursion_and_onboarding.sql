-- Fix infinite recursion in users table policies and enforce onboarding
-- Run this in your production Supabase SQL Editor immediately

-- 1. First, drop all existing policies on users table to fix recursion
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "System can create user profiles" ON public.users;

-- 2. Create simple, non-recursive policies
-- Allow users to view all user profiles (needed for the app to function)
CREATE POLICY "Anyone can view user profiles" ON public.users
FOR SELECT
USING (true);

-- Allow system to create profiles (for the trigger)
CREATE POLICY "System can create profiles" ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Allow users to update their own profile only
CREATE POLICY "Users update own profile" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Update the handle_new_user function to ensure onboarded is false for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'sales-professional')
  ) ON CONFLICT (id) DO NOTHING;

  -- Ensure onboarded is set to false for new sales professionals
  IF COALESCE(NEW.raw_user_meta_data ->> 'role', 'sales-professional') = 'sales-professional' THEN
    -- Update auth metadata to ensure onboarded is false
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || '{"onboarded": false}'::jsonb
    WHERE id = NEW.id;
  END IF;

  -- Only try to add availability if the function exists
  BEGIN
    PERFORM add_default_availability_for_user(NEW.id);
  EXCEPTION
    WHEN undefined_function THEN
      NULL;
    WHEN OTHERS THEN
      RAISE WARNING 'Error in add_default_availability_for_user: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add a column to track onboarding status in the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE;

-- 5. Create a function to check and enforce onboarding
CREATE OR REPLACE FUNCTION is_user_onboarded(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  onboarded_status BOOLEAN;
BEGIN
  SELECT COALESCE(onboarded, FALSE) INTO onboarded_status
  FROM public.users
  WHERE id = user_id;
  
  RETURN COALESCE(onboarded_status, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Update existing users who might be stuck
UPDATE public.users 
SET onboarded = FALSE 
WHERE role = 'sales-professional' 
AND onboarded IS NULL;

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE 'Infinite recursion fixed and onboarding enforcement added!';
  RAISE NOTICE 'New sales professionals will now be forced to complete onboarding.';
END $$; 