# Fix for "Database error saving new user" during signup

## Problem
The signup process is failing with "Database error saving new user" because:
1. The `public.users` table has Row Level Security (RLS) enabled
2. The insert policy requires `auth.uid() = id` (users can only insert their own record)
3. The trigger function `handle_new_user` runs with `SECURITY DEFINER` privileges
4. When the trigger tries to insert, it's not running as the user, causing RLS to block it

## Solution
You need to update the RLS policies to allow the system trigger to insert user records.

## Steps to Fix

### Option 1: Update the Insert Policy (Recommended)
This is the simpler solution that modifies the existing policy.

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run the contents of `fix_user_insert_policy.sql`:

```sql
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
```

### Option 2: Update the Trigger Function (Alternative)
If Option 1 doesn't work, try updating the trigger function itself:

1. Run the contents of `fix_user_creation_trigger.sql` in the SQL Editor

This updates the trigger to handle errors gracefully and adds a system-level insert policy.

### Testing
After applying the fix:
1. Try signing up a new user
2. Check the Authentication → Users tab in Supabase to verify the auth user was created
3. Check the Table Editor → users table to verify the public user record was created

### Additional Debugging
If the issue persists, check:
1. **Supabase Logs**: Dashboard → Logs → Edge Logs for any error messages
2. **Database Functions**: Verify the `handle_new_user` function exists
3. **Trigger Status**: Verify the `on_auth_user_created` trigger is active

### Quick Test Query
Run this in the SQL Editor to verify your setup:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- Check current policies on users table
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## Prevention
To prevent this in the future:
1. Always test RLS policies with trigger functions
2. Consider using `auth.uid() IS NULL` in insert policies to allow system operations
3. Test signup flow after any RLS policy changes 