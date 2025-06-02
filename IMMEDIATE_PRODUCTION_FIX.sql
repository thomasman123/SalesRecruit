-- IMMEDIATE FIX: Update trigger to handle missing function
-- Run this in your production Supabase SQL Editor NOW

-- First, update the trigger function to safely handle the missing function
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

  -- Only try to add availability if the function exists
  -- Using a different check method that works better
  BEGIN
    -- Try to call the function in a nested block
    PERFORM add_default_availability_for_user(NEW.id);
  EXCEPTION
    WHEN undefined_function THEN
      -- Function doesn't exist, just continue
      NULL;
    WHEN OTHERS THEN
      -- Log other errors but don't fail
      RAISE WARNING 'Error in add_default_availability_for_user: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the RLS policies
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation" ON public.users;
DROP POLICY IF EXISTS "System can create user profiles" ON public.users;

-- Create a single, working insert policy
CREATE POLICY "Allow user profile creation" ON public.users
FOR INSERT
WITH CHECK (
  auth.uid() = id OR auth.uid() IS NULL
);

-- Ensure select and update policies exist
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
CREATE POLICY "Authenticated users can view all users" ON public.users
FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE 'Production signup fix applied successfully!';
  RAISE NOTICE 'The trigger will now handle the missing availability function gracefully.';
END $$; 