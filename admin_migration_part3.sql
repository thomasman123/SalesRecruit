-- Admin Migration Part 3: Update Auth Functions
-- Run this after Part 2 in Supabase SQL Editor

-- Update the handle_new_user function to support admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the role from metadata, defaulting to sales-professional
  DECLARE
    user_role TEXT;
  BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'sales-professional');
    
    -- Validate role
    IF user_role NOT IN ('recruiter', 'sales-professional', 'admin') THEN
      user_role := 'sales-professional';
    END IF;
    
    -- Insert into public.users
    INSERT INTO public.users (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
      user_role
    ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = CASE 
        WHEN public.users.role = 'admin' THEN public.users.role -- Don't overwrite admin role
        ELSE EXCLUDED.role 
      END;
    
    -- Add default calendar availability if applicable
    PERFORM add_default_availability_for_user(NEW.id);
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the add_default_availability_for_user function to include admin
CREATE OR REPLACE FUNCTION add_default_availability_for_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Add availability for recruiters, sales professionals, and admins
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role IN ('recruiter', 'sales-professional', 'admin')
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

-- Update role change trigger to include admin
CREATE OR REPLACE FUNCTION update_availability_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role changed to recruiter, sales-professional, or admin
  IF NEW.role IN ('recruiter', 'sales-professional', 'admin') 
     AND (OLD.role IS NULL OR OLD.role NOT IN ('recruiter', 'sales-professional', 'admin')) THEN
    PERFORM add_default_availability_for_user(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Done with Part 3!
SELECT 'Part 3 completed successfully! Now you can create your admin user.' as status; 