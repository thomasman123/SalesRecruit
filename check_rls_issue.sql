-- Quick Check: Is RLS blocking access to calendar_availability?

-- 1. Check if RLS is enabled on calendar tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS is ON - may need policies'
    ELSE 'RLS is OFF - not blocking access'
  END as status
FROM pg_tables
WHERE tablename IN ('calendar_availability', 'scheduled_interviews', 'calendar_connections', 'users')
ORDER BY tablename;

-- 2. Check existing policies on calendar_availability
SELECT 
  'Current Policies on calendar_availability:' as info;
  
SELECT 
  policyname,
  cmd as applies_to,
  permissive,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'calendar_availability'
ORDER BY policyname;

-- 3. Count records visible WITHOUT RLS (as superuser)
SELECT 
  'Total records in calendar_availability (bypassing RLS):' as info,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users
FROM calendar_availability;

-- 4. Show sample of actual data
SELECT 
  'Sample availability data:' as info;
  
SELECT 
  ca.user_id,
  u.email,
  u.role,
  COUNT(*) as days_configured
FROM calendar_availability ca
JOIN users u ON u.id = ca.user_id
GROUP BY ca.user_id, u.email, u.role
LIMIT 5;

-- 5. If you need to temporarily disable RLS to test (BE CAREFUL - only for debugging!)
-- ALTER TABLE calendar_availability DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable it after testing:
-- ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY; 