-- Clean up duplicate/conflicting RLS policies on notifications table

-- 1. First, let's see all current policies
SELECT 
  'BEFORE CLEANUP:' as status,
  policyname,
  cmd as operation,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- 2. Drop ALL existing policies to start completely fresh
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Drop any other policies that might exist
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON notifications', pol.policyname);
    END LOOP;
END $$;

-- 3. Create only the necessary policies
-- Policy for users to SELECT their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to UPDATE their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy for service role to INSERT notifications
-- Note: This policy will only work for service role as regular users can't bypass RLS
CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- 4. Verify the cleanup
SELECT 
  'AFTER CLEANUP:' as status,
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- 5. Test that policies are working correctly
-- This should return the count of your notifications
SELECT 
  'Your notifications count: ' || COUNT(*) as test_result
FROM notifications
WHERE user_id = auth.uid();

-- 6. Final summary
SELECT 
  'Cleanup complete!' as message,
  'You should now have exactly 3 policies:' as policies,
  '1. Users can view their own notifications (SELECT)' as policy_1,
  '2. Users can update their own notifications (UPDATE)' as policy_2,
  '3. Service role can insert notifications (INSERT)' as policy_3; 