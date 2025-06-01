-- Update the handle_new_user trigger to also create default calendar availability

-- First ensure we have the add_default_availability_for_user function
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

-- Update the existing handle_new_user function to also create calendar availability
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

  -- Add default calendar availability if user is recruiter or sales professional
  PERFORM add_default_availability_for_user(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger already exists from previous migrations, so we don't need to recreate it
-- The trigger will automatically use the updated function 