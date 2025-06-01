-- Quick Fix: Ensure all recruiters and sales professionals have availability set

-- 1. Show current status
SELECT 
  u.id,
  u.email,
  u.role,
  COUNT(ca.id) as availability_count
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.id, u.email, u.role
ORDER BY availability_count, u.role;

-- 2. Add default availability for users who don't have any
-- This will add Monday-Friday 9AM-5PM for all users without availability
INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
SELECT 
  u.id,
  day_num::int,
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
ON CONFLICT DO NOTHING;

-- 3. Fix any incomplete availability (users who have some days but not all)
INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
SELECT 
  u.id,
  day_num::int,
  COALESCE(
    (SELECT start_time FROM calendar_availability WHERE user_id = u.id LIMIT 1),
    '09:00:00'::time
  ),
  COALESCE(
    (SELECT end_time FROM calendar_availability WHERE user_id = u.id LIMIT 1),
    '17:00:00'::time
  ),
  CASE WHEN day_num IN (0, 6) THEN false ELSE true END
FROM users u
CROSS JOIN generate_series(0, 6) as day_num
WHERE u.role IN ('recruiter', 'sales-professional')
  AND NOT EXISTS (
    SELECT 1 FROM calendar_availability ca 
    WHERE ca.user_id = u.id AND ca.day_of_week = day_num
  )
ON CONFLICT DO NOTHING;

-- 4. Verify the fix
SELECT 
  u.role,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT ca.user_id) as users_with_availability,
  COUNT(ca.id) as total_availability_records
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.role;

-- 5. Show a sample of the data
SELECT 
  u.email,
  u.role,
  ca.day_of_week,
  ca.start_time,
  ca.end_time,
  ca.is_available
FROM users u
JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
ORDER BY u.email, ca.day_of_week
LIMIT 20; 