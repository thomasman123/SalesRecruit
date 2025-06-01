-- Quick Test: Check if availability is working

-- Replace these with actual user IDs from your system
-- You can find them by running: SELECT id, email, role FROM users WHERE role IN ('recruiter', 'sales-professional');

-- Test for a specific date (e.g., Tuesday = day 2)
WITH test_params AS (
  SELECT 
    'YOUR_RECRUITER_ID'::uuid as recruiter_id,  -- Replace with actual recruiter ID
    'YOUR_SALES_REP_ID'::uuid as sales_rep_id,  -- Replace with actual sales rep ID
    2 as test_day  -- Tuesday
)
SELECT 
  'Recruiter Availability' as user_type,
  u.email,
  ca.day_of_week,
  ca.is_available,
  to_char(ca.start_time, 'HH24:MI') || '-' || to_char(ca.end_time, 'HH24:MI') as hours
FROM test_params tp
JOIN users u ON u.id = tp.recruiter_id
LEFT JOIN calendar_availability ca ON ca.user_id = u.id AND ca.day_of_week = tp.test_day
UNION ALL
SELECT 
  'Sales Rep Availability' as user_type,
  u.email,
  ca.day_of_week,
  ca.is_available,
  to_char(ca.start_time, 'HH24:MI') || '-' || to_char(ca.end_time, 'HH24:MI') as hours
FROM test_params tp
JOIN users u ON u.id = tp.sales_rep_id
LEFT JOIN calendar_availability ca ON ca.user_id = u.id AND ca.day_of_week = tp.test_day;

-- Show all availability for all users (simplified view)
SELECT 
  u.email,
  u.role,
  COUNT(ca.id) as days_with_availability,
  COUNT(CASE WHEN ca.is_available THEN 1 END) as available_days
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.id, u.email, u.role
ORDER BY u.role, u.email; 