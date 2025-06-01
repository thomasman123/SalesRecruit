-- Setup Default Availability for Testing
-- This script sets up default availability for users who haven't configured their calendar availability

-- Replace these with actual user IDs
-- You can find user IDs by running: SELECT id, email, role FROM users;
SET @recruiter_id = 'REPLACE_WITH_RECRUITER_ID';
SET @sales_rep_id = 'REPLACE_WITH_SALES_REP_ID';

-- For PostgreSQL (Supabase), use this format instead:
-- Define the user IDs as constants
DO $$
DECLARE
  recruiter_id UUID := 'REPLACE_WITH_RECRUITER_ID';
  sales_rep_id UUID := 'REPLACE_WITH_SALES_REP_ID';
BEGIN
  -- Delete existing availability for these users (optional)
  DELETE FROM calendar_availability WHERE user_id IN (recruiter_id, sales_rep_id);
  
  -- Insert default availability for recruiter (Monday-Friday, 9 AM - 5 PM)
  INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
  VALUES 
    (recruiter_id, 1, '09:00:00', '17:00:00', true), -- Monday
    (recruiter_id, 2, '09:00:00', '17:00:00', true), -- Tuesday
    (recruiter_id, 3, '09:00:00', '17:00:00', true), -- Wednesday
    (recruiter_id, 4, '09:00:00', '17:00:00', true), -- Thursday
    (recruiter_id, 5, '09:00:00', '17:00:00', true), -- Friday
    (recruiter_id, 6, '09:00:00', '17:00:00', false), -- Saturday
    (recruiter_id, 0, '09:00:00', '17:00:00', false); -- Sunday
  
  -- Insert default availability for sales rep (Monday-Friday, 10 AM - 6 PM)
  INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
  VALUES 
    (sales_rep_id, 1, '10:00:00', '18:00:00', true), -- Monday
    (sales_rep_id, 2, '10:00:00', '18:00:00', true), -- Tuesday
    (sales_rep_id, 3, '10:00:00', '18:00:00', true), -- Wednesday
    (sales_rep_id, 4, '10:00:00', '18:00:00', true), -- Thursday
    (sales_rep_id, 5, '10:00:00', '18:00:00', true), -- Friday
    (sales_rep_id, 6, '10:00:00', '18:00:00', false), -- Saturday
    (sales_rep_id, 0, '10:00:00', '18:00:00', false); -- Sunday
END $$;

-- Verify the availability was set
SELECT 
  u.email,
  u.role,
  ca.day_of_week,
  ca.start_time,
  ca.end_time,
  ca.is_available
FROM calendar_availability ca
JOIN users u ON u.id = ca.user_id
WHERE u.id IN ('REPLACE_WITH_RECRUITER_ID', 'REPLACE_WITH_SALES_REP_ID')
ORDER BY u.email, ca.day_of_week;

-- Check for overlapping availability
WITH user_availability AS (
  SELECT 
    u.id,
    u.email,
    u.role,
    ca.day_of_week,
    ca.start_time,
    ca.end_time,
    ca.is_available
  FROM users u
  LEFT JOIN calendar_availability ca ON ca.user_id = u.id
  WHERE u.id IN ('REPLACE_WITH_RECRUITER_ID', 'REPLACE_WITH_SALES_REP_ID')
)
SELECT 
  'Day ' || day_of_week as day,
  MAX(CASE WHEN role = 'recruiter' THEN start_time::text END) as recruiter_start,
  MAX(CASE WHEN role = 'recruiter' THEN end_time::text END) as recruiter_end,
  MAX(CASE WHEN role = 'sales-professional' THEN start_time::text END) as sales_rep_start,
  MAX(CASE WHEN role = 'sales-professional' THEN end_time::text END) as sales_rep_end,
  CASE 
    WHEN MAX(CASE WHEN role = 'recruiter' THEN is_available::int END) = 1 
     AND MAX(CASE WHEN role = 'sales-professional' THEN is_available::int END) = 1 
    THEN 'Both Available' 
    ELSE 'Not Both Available' 
  END as status
FROM user_availability
GROUP BY day_of_week
ORDER BY day_of_week; 