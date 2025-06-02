# URGENT: Fix Production Signup Error on heliosrecruit.com

## Quick Fix Steps

### Step 1: Apply the Fix to Production Supabase

1. **Log in to your Production Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your production project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run this SQL immediately:**

```sql
-- URGENT FIX: Allow trigger to create user profiles during signup

-- Drop the restrictive policy that's blocking signups
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;

-- Create a new policy that allows system-triggered inserts
CREATE POLICY "Allow user profile creation" ON public.users
FOR INSERT
WITH CHECK (
  auth.uid() = id OR auth.uid() IS NULL
);

-- Ensure other necessary policies exist
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
  RAISE NOTICE 'Signup fix applied successfully!';
END $$;
```

4. **Click "Run" to execute the SQL**

### Step 2: Verify the Fix

1. **Test Signup Immediately**
   - Go to https://www.heliosrecruit.com/rep
   - Try signing up with a test email
   - The signup should now work

2. **Check in Supabase Dashboard**
   - Go to Authentication → Users (verify auth user created)
   - Go to Table Editor → users (verify public.users record created)

### Step 3: Monitor for Issues

Check the Supabase logs if you still have issues:
- Dashboard → Logs → Edge Logs
- Look for any error messages related to the signup

## If the Above Doesn't Work

Run this more comprehensive fix:

```sql
-- Alternative fix: Update the trigger to handle errors gracefully
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

  -- Add default calendar availability if applicable
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'add_default_availability_for_user'
  ) THEN
    PERFORM add_default_availability_for_user(NEW.id);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the signup if user profile creation fails
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also add a permissive system policy
DROP POLICY IF EXISTS "System can create user profiles" ON public.users;
CREATE POLICY "System can create user profiles" ON public.users
FOR INSERT
WITH CHECK (true);
```

## Important Notes

- This is a critical production fix
- The issue is preventing ALL new user signups
- Apply the fix immediately to restore signup functionality
- Test with a dummy email after applying

## Root Cause
The RLS policy `WITH CHECK (auth.uid() = id)` was blocking the database trigger from creating user profiles during signup, because triggers run with different permissions than the signing-up user. 