-- Add default availability trigger and backfill existing users

-- 1. Create function to add default availability for a user
CREATE OR REPLACE FUNCTION add_default_availability_for_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Only add availability for recruiters and sales professionals
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role IN ('recruiter', 'sales-professional')
  ) THEN
    -- Insert default availability (Monday-Friday 9AM-5PM, weekends off)
    INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
    VALUES
      (user_id, 0, '09:00:00', '17:00:00', false), -- Sunday
      (user_id, 1, '09:00:00', '17:00:00', true),  -- Monday
      (user_id, 2, '09:00:00', '17:00:00', true),  -- Tuesday
      (user_id, 3, '09:00:00', '17:00:00', true),  -- Wednesday
      (user_id, 4, '09:00:00', '17:00:00', true),  -- Thursday
      (user_id, 5, '09:00:00', '17:00:00', true),  -- Friday
      (user_id, 6, '09:00:00', '17:00:00', false)  -- Saturday
    ON CONFLICT (user_id, day_of_week) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger function
CREATE OR REPLACE FUNCTION create_default_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the function to add default availability
  PERFORM add_default_availability_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger on users table
DROP TRIGGER IF EXISTS create_default_availability_trigger ON users;
CREATE TRIGGER create_default_availability_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_availability();

-- 4. Also trigger on role update (in case user role changes)
CREATE OR REPLACE FUNCTION update_availability_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role changed to recruiter or sales-professional
  IF NEW.role IN ('recruiter', 'sales-professional') 
     AND (OLD.role IS NULL OR OLD.role NOT IN ('recruiter', 'sales-professional')) THEN
    PERFORM add_default_availability_for_user(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_availability_on_role_change_trigger ON users;
CREATE TRIGGER update_availability_on_role_change_trigger
AFTER UPDATE OF role ON users
FOR EACH ROW
EXECUTE FUNCTION update_availability_on_role_change();

-- 5. Backfill all existing users
DO $$
DECLARE
  user_record RECORD;
  inserted_count INTEGER := 0;
BEGIN
  -- Loop through all recruiters and sales professionals
  FOR user_record IN 
    SELECT id, email, role 
    FROM users 
    WHERE role IN ('recruiter', 'sales-professional')
  LOOP
    -- Add default availability for this user
    PERFORM add_default_availability_for_user(user_record.id);
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Added default availability for % users', inserted_count;
END $$;

-- 6. Verify the results
SELECT 
  'Availability Status After Migration' as report,
  u.role,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT ca.user_id) as users_with_availability,
  COUNT(ca.id) as total_availability_records,
  COUNT(ca.id)::float / COUNT(DISTINCT u.id) as avg_days_per_user
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.role
ORDER BY u.role;

-- 7. Show sample of the data
SELECT 
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
    CASE WHEN ca.is_available THEN '✓' ELSE '✗' END
    ORDER BY ca.day_of_week
  ) as availability
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.id, u.email, u.role
LIMIT 10; 