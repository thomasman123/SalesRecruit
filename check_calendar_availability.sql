-- Diagnostic Script for Calendar Availability Issues

-- 1. Check all users and their roles
SELECT id, email, role, name 
FROM users 
ORDER BY role, email;

-- 2. Check if calendar_availability table exists and has data
SELECT COUNT(*) as total_availability_records 
FROM calendar_availability;

-- 3. Show all availability records with user details
SELECT 
  u.email,
  u.role,
  ca.day_of_week,
  CASE ca.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name,
  ca.start_time,
  ca.end_time,
  ca.is_available
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
ORDER BY u.email, ca.day_of_week;

-- 4. Check users without any availability set
SELECT 
  u.id,
  u.email,
  u.role,
  COUNT(ca.id) as availability_count
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.id, u.email, u.role
HAVING COUNT(ca.id) = 0;

-- 5. Quick setup: Add default availability for ALL users who don't have any
-- UNCOMMENT THE LINES BELOW TO RUN THIS
/*
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
    WHERE ca.user_id = u.id AND ca.day_of_week = day_num
  );
*/

-- 6. After running the insert above, check again
-- SELECT COUNT(*) as total_after_insert FROM calendar_availability; 