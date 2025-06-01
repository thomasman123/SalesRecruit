-- Fix Users Table RLS Policies for API Access

-- 1. Check current policies on users table
SELECT 
  policyname,
  cmd as operation,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 2. Drop the policy if it exists, then create it
DROP POLICY IF EXISTS "Authenticated users can view all users basic info" ON users;

-- Create a policy that allows authenticated users to view other users' basic info
-- This is needed for features like invitations, messaging, etc.
CREATE POLICY "Authenticated users can view all users basic info"
ON users
FOR SELECT
USING (auth.role() = 'authenticated');

-- Alternative: If you want to be more restrictive, only allow viewing specific columns
-- But for now, let's allow viewing all user data for authenticated users

-- 3. Verify the fix
SELECT 
  'Testing user lookup...' as test,
  COUNT(*) as users_found
FROM users
WHERE role = 'sales-professional';

-- 4. Test specific user lookup (the one from your error)
SELECT 
  id,
  email,
  name,
  role
FROM users
WHERE id = '9ff0bf93-e364-40bb-a0fb-40ad48e39366';

-- 5. Show all policies on users table after fix
SELECT 
  'AFTER FIX:' as status,
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 6. Summary
SELECT 
  'Fix applied!' as message,
  'The API should now be able to find sales reps when sending invitations' as result; 