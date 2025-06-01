-- Verification Script: Check Calendar Availability Setup

-- 1. Overview of all users and their availability
SELECT 
  'USER AVAILABILITY OVERVIEW' as report_section,
  u.role,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT ca.user_id) as users_with_availability,
  COUNT(DISTINCT CASE WHEN ca.user_id IS NULL THEN u.id END) as users_without_availability,
  ROUND(COUNT(DISTINCT ca.user_id)::numeric / COUNT(DISTINCT u.id) * 100, 2) as percentage_with_availability
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.role;

-- 2. List users WITHOUT availability (these need fixing)
SELECT 
  'USERS WITHOUT AVAILABILITY' as report_section,
  u.id,
  u.email,
  u.role,
  u.created_at
FROM users u
WHERE u.role IN ('recruiter', 'sales-professional')
  AND NOT EXISTS (
    SELECT 1 FROM calendar_availability ca WHERE ca.user_id = u.id
  )
ORDER BY u.created_at DESC;

-- 3. Show sample of users WITH availability
SELECT 
  'SAMPLE USERS WITH AVAILABILITY' as report_section,
  u.email,
  u.role,
  COUNT(ca.id) as days_configured,
  array_agg(
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
    ' (' || to_char(ca.start_time, 'HH24:MI') || '-' || to_char(ca.end_time, 'HH24:MI') || ')'
    ORDER BY ca.day_of_week
  ) as weekly_schedule
FROM users u
JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.id, u.email, u.role
LIMIT 5;

-- 4. Check for any data inconsistencies
SELECT 
  'DATA CONSISTENCY CHECK' as report_section,
  COUNT(DISTINCT CASE WHEN ca.start_time >= ca.end_time THEN ca.id END) as invalid_time_ranges,
  COUNT(DISTINCT CASE WHEN ca.day_of_week NOT BETWEEN 0 AND 6 THEN ca.id END) as invalid_days,
  COUNT(DISTINCT CASE WHEN ca.user_id NOT IN (SELECT id FROM users) THEN ca.user_id END) as orphaned_availability
FROM calendar_availability ca;

-- 5. Recent availability changes
SELECT 
  'RECENT AVAILABILITY UPDATES' as report_section,
  u.email,
  u.role,
  ca.day_of_week,
  ca.is_available,
  to_char(ca.start_time, 'HH24:MI') || '-' || to_char(ca.end_time, 'HH24:MI') as hours,
  ca.updated_at
FROM calendar_availability ca
JOIN users u ON u.id = ca.user_id
WHERE ca.updated_at > NOW() - INTERVAL '7 days'
ORDER BY ca.updated_at DESC
LIMIT 10; 