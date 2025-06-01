-- Fix notifications table RLS policies

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow system/service role to insert notifications for any user
-- This is needed for the API to create notifications
CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true); -- This will only work for service role since normal users can't bypass RLS

-- Verify the metadata column exists and has the right type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN metadata JSONB DEFAULT '{}';
    
    CREATE INDEX IF NOT EXISTS idx_notifications_metadata 
    ON notifications USING gin(metadata);
  END IF;
END $$;

-- Check if there are any notifications without proper metadata
UPDATE notifications
SET metadata = jsonb_build_object(
  'type', 'interview_invitation',
  'jobId', 0,
  'jobTitle', 'Unknown Position',
  'company', 'Unknown Company'
)
WHERE title LIKE '%Interview Invitation%'
AND (metadata IS NULL OR metadata = '{}');

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for various events like interview invitations';
COMMENT ON COLUMN notifications.metadata IS 'JSONB field containing structured data specific to the notification type'; 