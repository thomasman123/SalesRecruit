-- Comprehensive Fix Script: Apply all calendar availability fixes
-- Run this in Supabase SQL Editor to fix everything at once

-- 1. First ensure the add_default_availability_for_user function exists
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

-- 2. Update the handle_new_user function to include availability
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'sales-professional')
  ) ON CONFLICT (id) DO NOTHING;

  -- Add default calendar availability
  PERFORM add_default_availability_for_user(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger function for availability on user creation
CREATE OR REPLACE FUNCTION create_default_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the function to add default availability
  PERFORM add_default_availability_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on users table (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS create_default_availability_trigger ON users;
CREATE TRIGGER create_default_availability_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_availability();

-- 5. Create trigger for role changes
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

-- 6. Add constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'calendar_availability_user_day_unique'
  ) THEN
    ALTER TABLE calendar_availability 
    ADD CONSTRAINT calendar_availability_user_day_unique 
    UNIQUE (user_id, day_of_week);
  END IF;
END $$;

-- 7. Now backfill all existing users with default availability
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

-- 8. Show final status
SELECT 
  'FINAL STATUS' as report,
  u.role,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT ca.user_id) as users_with_availability,
  COUNT(ca.id) as total_availability_records,
  ROUND(COUNT(ca.id)::numeric / COUNT(DISTINCT u.id)::numeric, 2) as avg_days_per_user
FROM users u
LEFT JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.role
ORDER BY u.role;

-- 9. Show a few examples
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
    CASE WHEN ca.is_available THEN '✓' ELSE '✗' END,
    ', ' ORDER BY ca.day_of_week
  ) as weekly_schedule
FROM users u
JOIN calendar_availability ca ON ca.user_id = u.id
WHERE u.role IN ('recruiter', 'sales-professional')
GROUP BY u.id, u.email, u.role
LIMIT 5; 