-- Fix calendar_availability table constraints

-- Add unique constraint if it doesn't exist
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

-- Ensure updated_at column has a trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_calendar_availability_updated_at ON calendar_availability;
CREATE TRIGGER update_calendar_availability_updated_at 
BEFORE UPDATE ON calendar_availability 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Add default values for timestamps if not already present
ALTER TABLE calendar_availability 
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Populate any missing availability for existing users
INSERT INTO calendar_availability (user_id, day_of_week, start_time, end_time, is_available)
SELECT 
  u.id,
  day_num,
  '09:00:00'::time,
  '17:00:00'::time,
  CASE WHEN day_num IN (0, 6) THEN false ELSE true END
FROM users u
CROSS JOIN generate_series(0, 6) as day_num
WHERE u.role IN ('recruiter', 'sales-professional')
  AND NOT EXISTS (
    SELECT 1 FROM calendar_availability ca 
    WHERE ca.user_id = u.id AND ca.day_of_week = day_num
  )
ON CONFLICT (user_id, day_of_week) DO NOTHING; 