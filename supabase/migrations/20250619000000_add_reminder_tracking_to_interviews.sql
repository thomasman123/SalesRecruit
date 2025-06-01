-- Add reminder tracking columns to scheduled_interviews table

ALTER TABLE scheduled_interviews
ADD COLUMN IF NOT EXISTS day_reminder_sent timestamptz,
ADD COLUMN IF NOT EXISTS hour_reminder_sent timestamptz; 