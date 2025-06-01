-- Comprehensive RLS Fix for Calendar System
-- Run this to fix all RLS issues with calendar tables

-- 1. Fix calendar_availability RLS
ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view all availability" ON calendar_availability;
CREATE POLICY "Authenticated users can view all availability"
ON calendar_availability
FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage own availability" ON calendar_availability;
CREATE POLICY "Users can manage own availability"
ON calendar_availability
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Fix scheduled_interviews RLS
ALTER TABLE scheduled_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view scheduled interviews" ON scheduled_interviews;
CREATE POLICY "Authenticated users can view scheduled interviews"
ON scheduled_interviews
FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage interviews they're part of" ON scheduled_interviews;
CREATE POLICY "Users can manage interviews they're part of"
ON scheduled_interviews
FOR ALL
USING (
  auth.uid() = recruiter_id 
  OR auth.uid() = sales_rep_id
)
WITH CHECK (
  auth.uid() = recruiter_id 
  OR auth.uid() = sales_rep_id
);

-- 3. Fix calendar_connections RLS (if not already done)
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own calendar connections" ON calendar_connections;
CREATE POLICY "Users can view own calendar connections"
ON calendar_connections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Verify all policies are in place
SELECT 
  'RLS Status Report' as report,
  tablename,
  rowsecurity as rls_enabled,
  COUNT(policyname) as policy_count
FROM pg_tables
LEFT JOIN pg_policies USING (schemaname, tablename)
WHERE tablename IN ('calendar_availability', 'scheduled_interviews', 'calendar_connections')
GROUP BY tablename, rowsecurity
ORDER BY tablename;

-- 5. Test availability query (similar to what the API does)
WITH test_data AS (
  SELECT 
    u1.id as recruiter_id,
    u2.id as sales_rep_id
  FROM users u1, users u2
  WHERE u1.role = 'recruiter' 
  AND u2.role = 'sales-professional'
  LIMIT 1
)
SELECT 
  'Recruiter' as user_type,
  COUNT(*) as availability_records
FROM test_data td
JOIN calendar_availability ca ON ca.user_id = td.recruiter_id
UNION ALL
SELECT 
  'Sales Rep' as user_type,
  COUNT(*) as availability_records
FROM test_data td
JOIN calendar_availability ca ON ca.user_id = td.sales_rep_id; 