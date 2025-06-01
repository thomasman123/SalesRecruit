-- Add availability for recruiters who have none
-- This will fix the "Recruiter has 0 records" issue

-- 1. First, show which recruiters need availability
SELECT 
  u.id,
  u.email,
  u.role,
  COUNT(ca.id) as current_availability_count
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role = 'recruiter'
GROUP BY u.id, u.email, u.role
ORDER BY u.email;

-- 2. Add default availability for ALL recruiters
INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
SELECT 
  u.id,
  day.day_of_week,
  '09:00:00'::time,
  '17:00:00'::time,
  CASE 
    WHEN day.day_of_week IN (0, 6) THEN false  -- Weekends off
    ELSE true  -- Weekdays available
  END
FROM users u
CROSS JOIN (
  VALUES (0), (1), (2), (3), (4), (5), (6)
) AS day(day_of_week)
WHERE u.role = 'recruiter'
ON CONFLICT (user_id, day_of_week) DO NOTHING;

-- 3. Verify recruiters now have availability
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
    CASE WHEN ca.is_available THEN '✓' ELSE '✗' END,
    ', ' ORDER BY ca.day_of_week
  ) as weekly_schedule
FROM users u
JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role = 'recruiter'
GROUP BY u.id, u.email, u.role;

-- 4. Final check - count all users with availability
SELECT 
  role,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT ca.user_id) as users_with_availability
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY role
ORDER BY role; 