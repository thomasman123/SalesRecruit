-- IMMEDIATE FIX: Set default availability for ALL users who need it
-- This will fix any recruiter or sales professional who has missing availability

-- Delete any incomplete availability records first
DELETE FROM calendar_availability
WHERE user_id IN (
  SELECT user_id
  FROM calendar_availability
  GROUP BY user_id
  HAVING COUNT(*) < 7
);

-- Now add complete availability for all recruiters and sales professionals
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
WHERE u.role IN ('recruiter', 'sales-professional')
  AND NOT EXISTS (
    SELECT 1 
    FROM calendar_availability ca 
    WHERE ca.user_id = u.id
  );

-- Show results
SELECT 
  'FIXED!' as status,
  u.role,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT ca.user_id) as users_with_availability,
  MIN(cnt.days_count) as min_days_per_user,
  MAX(cnt.days_count) as max_days_per_user
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as days_count
  FROM calendar_availability
  GROUP BY user_id
) cnt ON cnt.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.role; 