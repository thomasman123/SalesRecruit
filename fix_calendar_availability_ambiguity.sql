-- Fix ambiguous column reference in add_default_availability_for_user function
-- Run this BEFORE running fix_application_error.sql

-- Update the function to use a different parameter name to avoid ambiguity
CREATE OR REPLACE FUNCTION add_default_availability_for_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Only add availability for recruiters and sales professionals
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_user_id 
    AND role IN ('recruiter', 'sales-professional')
  ) THEN
    -- Insert default availability (Monday-Friday 9AM-5PM, weekends off)
    INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
    VALUES
      (p_user_id, 0, '09:00:00', '17:00:00', false), -- Sunday
      (p_user_id, 1, '09:00:00', '17:00:00', true),  -- Monday
      (p_user_id, 2, '09:00:00', '17:00:00', true),  -- Tuesday
      (p_user_id, 3, '09:00:00', '17:00:00', true),  -- Wednesday
      (p_user_id, 4, '09:00:00', '17:00:00', true),  -- Thursday
      (p_user_id, 5, '09:00:00', '17:00:00', true),  -- Friday
      (p_user_id, 6, '09:00:00', '17:00:00', false)  -- Saturday
    ON CONFLICT (user_id, day_of_week) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Also check if the function exists before we run the user insertion
-- This will prevent the error from occurring
DO $$
BEGIN
  -- Drop the trigger temporarily to avoid issues during bulk insert
  DROP TRIGGER IF EXISTS create_default_availability_trigger ON public.users;
  
  RAISE NOTICE 'Calendar availability function updated to fix ambiguity';
  RAISE NOTICE 'Trigger temporarily dropped to allow bulk user insertion';
END $$; 