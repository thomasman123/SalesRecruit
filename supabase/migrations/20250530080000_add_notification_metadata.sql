-- Add metadata column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING gin(metadata); 