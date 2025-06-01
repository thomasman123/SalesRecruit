-- Fix Calendar Availability RLS Policies
-- This will allow the API to read availability records

-- 1. Enable RLS on the table (if not already enabled)
ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any (to start fresh)
DROP POLICY IF EXISTS "Users can view all availability" ON calendar_availability;
DROP POLICY IF EXISTS "Users can manage own availability" ON calendar_availability;
DROP POLICY IF EXISTS "Authenticated users can view all availability" ON calendar_availability;

-- 3. Create policy to allow authenticated users to VIEW all availability
-- This is needed for the availability API to check both users' schedules
CREATE POLICY "Authenticated users can view all availability"
ON calendar_availability
FOR SELECT
USING (auth.role() = 'authenticated');

-- 4. Create policy to allow users to manage their own availability
CREATE POLICY "Users can manage own availability"
ON calendar_availability
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Verify RLS is enabled and policies exist
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'calendar_availability';

-- 6. Show all policies on the table
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'calendar_availability'
ORDER BY policyname;

-- 7. Test if we can see availability records
SELECT 
  u.email,
  u.role,
  COUNT(ca.id) as availability_count
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.id, u.email, u.role
ORDER BY u.role, u.email; 