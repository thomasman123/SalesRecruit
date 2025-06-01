-- Immediate Fix: Set default availability for all existing users
-- Run this in Supabase SQL Editor

-- 1. Show current status before fix
SELECT 
  'BEFORE FIX' as status,
  role,
  COUNT(*) as total_users,
  COUNT(DISTINCT ca.user_id) as users_with_availability
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE role IN ('recruiter', 'sales-professional')
GROUP BY role;

-- 2. Insert default availability for ALL recruiters and sales professionals
-- This will set Monday-Friday 9AM-5PM, weekends off
INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
SELECT 
  u.id,
  day.day_of_week,
  '09:00:00'::time,
  '17:00:00'::time,
  CASE 
    WHEN day.day_of_week IN (0, 6) THEN false  -- Sunday (0) and Saturday (6) are off
    ELSE true  -- Monday-Friday are available
  END
FROM users u
CROSS JOIN (
  VALUES (0), (1), (2), (3), (4), (5), (6)
) AS day(day_of_week)
WHERE u.role IN ('recruiter', 'sales-professional')
ON CONFLICT (user_id, day_of_week) DO NOTHING;

-- 3. Show status after fix
SELECT 
  'AFTER FIX' as status,
  role,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT ca.user_id) as users_with_availability,
  COUNT(ca.id) as total_availability_records
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY role;

-- 4. Verify a few examples
SELECT 
  u.email,
  u.role,
  string_agg(
    CASE ca.day_of_week 
      WHEN 0 THEN 'Sun'
      WHEN 1 THEN 'Mon' 
      WHEN 2 THEN 'Tue'
      WHEN 3 THEN 'Wed'
      WHEN 4 THEN 'Thu'
      WHEN 5 THEN 'Fri'
      WHEN 6 THEN 'Sat'
    END || ': ' || 
    to_char(ca.start_time, 'HH24:MI') || '-' || 
    to_char(ca.end_time, 'HH24:MI') || ' ' ||
    CASE WHEN ca.is_available THEN '✓' ELSE '✗' END,
    ', ' ORDER BY ca.day_of_week
  ) as weekly_schedule
FROM users u
JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.id, u.email, u.role
LIMIT 5; 