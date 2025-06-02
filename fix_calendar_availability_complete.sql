-- Complete fix for calendar availability function
-- This drops the function first to allow parameter name change

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS add_default_availability_for_user(uuid);

-- 2. Recreate with fixed parameter name
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

-- 3. Now run the application fix policies
DROP POLICY IF EXISTS "Sales professionals can apply to jobs" ON public.applicants;

CREATE POLICY "Sales professionals can apply to jobs"
ON public.applicants
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND
    (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND
    (user_id = auth.uid() OR user_id IS NULL)
);

DROP POLICY IF EXISTS "Sales professionals can view their own applications" ON public.applicants;

CREATE POLICY "Sales professionals can view their own applications"
ON public.applicants
FOR SELECT
USING (
    user_id = auth.uid() 
    OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 4. Success message
DO $$
BEGIN
    RAISE NOTICE 'Calendar function fixed and application policies updated!';
    RAISE NOTICE 'You should now be able to apply to jobs.';
END $$; 