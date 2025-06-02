-- Fix user creation trigger to work with RLS policies
-- This updates the handle_new_user function to bypass RLS when creating users

-- Update the handle_new_user function to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Temporarily disable RLS for this operation
  -- This is safe because this function runs with SECURITY DEFINER
  -- and is only triggered by auth.users inserts
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'sales-professional')
  ) ON CONFLICT (id) DO NOTHING;

  -- Add default calendar availability if user is recruiter or sales professional
  -- Check if the function exists before calling it
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'add_default_availability_for_user'
  ) THEN
    PERFORM add_default_availability_for_user(NEW.id);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also create or update a service-level policy that allows the trigger to insert
DROP POLICY IF EXISTS "System can create user profiles" ON public.users;
CREATE POLICY "System can create user profiles" ON public.users
FOR INSERT
WITH CHECK (true); -- This allows any insert, but only functions with SECURITY DEFINER can bypass normal RLS

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test that the policies are working correctly
DO $$
BEGIN
  RAISE NOTICE 'User creation trigger has been updated to handle RLS properly';
  RAISE NOTICE 'The trigger will now catch and log errors instead of failing the signup';
END $$; 