-- Add RLS policies for calendar_availability table
-- This ensures the API can read availability records

-- Enable RLS on the table
ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all availability" ON calendar_availability;
DROP POLICY IF EXISTS "Users can manage own availability" ON calendar_availability;
DROP POLICY IF EXISTS "Authenticated users can view all availability" ON calendar_availability;

-- Allow authenticated users to view all availability records
-- This is required for the scheduling API to check both users' availability
CREATE POLICY "Authenticated users can view all availability"
ON calendar_availability
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to manage their own availability
CREATE POLICY "Users can manage own availability"
ON calendar_availability
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); 