-- Add reminder tracking columns to scheduled_interviews table
-- Run this in Supabase SQL Editor

-- Add the columns if they don't exist
ALTER TABLE scheduled_interviews
ADD COLUMN IF NOT EXISTS day_reminder_sent timestamptz,
ADD COLUMN IF NOT EXISTS hour_reminder_sent timestamptz;

-- Verify the columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'scheduled_interviews'
  AND column_name IN ('day_reminder_sent', 'hour_reminder_sent')
ORDER BY column_name; 