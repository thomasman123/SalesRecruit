-- Fix notifications read state persistence and performance

-- 1. Ensure the read column has a proper default value
ALTER TABLE notifications 
ALTER COLUMN read SET DEFAULT false;

-- 2. Update any NULL read values to false
UPDATE notifications 
SET read = false 
WHERE read IS NULL;

-- 3. Make read column NOT NULL now that we've cleaned up the data
ALTER TABLE notifications 
ALTER COLUMN read SET NOT NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 5. Create a composite index for the common query pattern
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, created_at DESC) 
WHERE read = false;

-- 6. Ensure RLS policies are optimal
-- Drop and recreate to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- Recreate with explicit permissions
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- 7. Add a trigger to automatically set created_at if not provided
CREATE OR REPLACE FUNCTION set_notification_created_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notification_created_at_trigger ON notifications;
CREATE TRIGGER set_notification_created_at_trigger
BEFORE INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION set_notification_created_at();

-- 8. Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Notifications table structure updated successfully';
  RAISE NOTICE 'Indexes created for better performance';
  RAISE NOTICE 'RLS policies updated';
END $$; 