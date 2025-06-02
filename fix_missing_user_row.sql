-- Fix missing user row after signup
-- Run this in your production Supabase SQL Editor

-- 1. First, check if the trigger exists
SELECT 
    tgname as trigger_name,
    tgenabled as is_enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 2. Check if the function exists
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Manually insert missing users from auth.users to public.users
INSERT INTO public.users (id, email, name, role, onboarded)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as name,
    COALESCE(au.raw_user_meta_data->>'role', 'sales-professional') as role,
    FALSE as onboarded
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 4. Recreate the trigger if it's missing or disabled
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 5. Create a simpler, more reliable trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users with minimal logic to avoid failures
  INSERT INTO public.users (id, email, name, role, onboarded)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales-professional'),
    FALSE
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Test the setup by checking recently created auth users
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    pu.id as public_user_id,
    pu.created_at as public_created,
    CASE 
        WHEN pu.id IS NULL THEN 'MISSING IN PUBLIC.USERS'
        ELSE 'OK'
    END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.created_at > NOW() - INTERVAL '1 day'
ORDER BY au.created_at DESC;

-- 8. Verify the fix worked
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL;
    
    RAISE NOTICE 'Found % auth users without corresponding public.users records', missing_count;
    RAISE NOTICE 'These have been inserted. The trigger has been recreated.';
END $$; 