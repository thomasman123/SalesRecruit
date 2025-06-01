-- Fix Recruiter Availability - Run this for the specific recruiter having issues

-- 1. First, check which recruiters have missing availability
SELECT 
  u.id,
  u.email,
  u.role,
  COUNT(ca.id) as availability_records
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role = 'recruiter'
GROUP BY u.id, u.email, u.role
HAVING COUNT(ca.id) < 7
ORDER BY COUNT(ca.id);

-- 2. Set default availability for ALL recruiters who have less than 7 days configured
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
WHERE u.role = 'recruiter'
  AND NOT EXISTS (
    SELECT 1 
    FROM calendar_availability ca 
    WHERE ca.user_id = u.id 
    AND ca.day_of_week = day.day_of_week
  );

-- 3. Verify the fix
SELECT 
  u.email,
  u.role,
  COUNT(ca.id) as days_configured,
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
    CASE WHEN ca.is_available THEN '✓' ELSE '✗' END || 
    ' (' || to_char(ca.start_time, 'HH24:MI') || '-' || to_char(ca.end_time, 'HH24:MI') || ')',
    ', ' ORDER BY ca.day_of_week
  ) as weekly_schedule
FROM users u
JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role = 'recruiter'
GROUP BY u.id, u.email, u.role
ORDER BY u.email; 