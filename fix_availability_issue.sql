-- Fix Availability Issue Script

-- 1. First, let's see all users and their availability status
SELECT 
  u.id,
  u.email,
  u.role,
  u.name,
  COUNT(ca.id) as availability_count
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.id, u.email, u.role, u.name
ORDER BY u.role, u.email;

-- 2. Show detailed availability for all users
SELECT 
  u.email,
  u.role,
  ca.*
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
ORDER BY u.email, ca.day_of_week;

-- 3. Check for any data type issues in calendar_availability
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'calendar_availability'
ORDER BY ordinal_position;

-- 4. Quick fix: Add default availability for ALL recruiters and sales reps who don't have ANY
INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
SELECT 
  u.id,
  day_num,
  '09:00:00'::time,
  '17:00:00'::time,
  CASE WHEN day_num IN (0, 6) THEN false ELSE true END
FROM users u
CROSS JOIN generate_series(0, 6) as day_num
WHERE u.role IN ('recruiter', 'sales-professional')
  AND NOT EXISTS (
    SELECT 1 FROM calendar_availability ca 
    WHERE ca.user_id = u.id
  )
ON CONFLICT (user_id, day_of_week) DO NOTHING;

-- 5. Verify the fix worked
SELECT 
  'After fix:' as status,
  u.role,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT ca.user_id) as users_with_availability
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.role;

-- 6. Test specific user availability lookup (replace with actual IDs)
-- This mimics what the API does
WITH test_users AS (
  SELECT 
    'REPLACE_WITH_RECRUITER_ID'::uuid as recruiter_id,
    'REPLACE_WITH_SALES_REP_ID'::uuid as sales_rep_id,
    3 as test_day_of_week -- Wednesday
)
SELECT 
  'Recruiter availability:' as user_type,
  ca.*
FROM test_users tu
LEFT JOIN calendar_availability ca ON ca.user_id = tu.recruiter_id AND ca.day_of_week = tu.test_day_of_week
UNION ALL
SELECT 
  'Sales rep availability:' as user_type,
  ca.*
FROM test_users tu
LEFT JOIN calendar_availability ca ON ca.user_id = tu.sales_rep_id AND ca.day_of_week = tu.test_day_of_week;

-- 7. If you need to completely reset availability for a specific user
-- UNCOMMENT and replace USER_ID
/*
DELETE FROM calendar_availability WHERE user_id = 'USER_ID';
INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
SELECT 
  'USER_ID'::uuid,
  day_num,
  '09:00:00'::time,
  '17:00:00'::time,
  CASE WHEN day_num IN (0, 6) THEN false ELSE true END
FROM generate_series(0, 6) as day_num;
*/ 