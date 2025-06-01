-- Enable Realtime for Activity Logs
-- Run this in Supabase SQL Editor after running the admin migrations

-- Enable realtime for the activity_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- Verify it's enabled
SELECT 
  schemaname,
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'activity_logs';

-- You should see:
-- schemaname | tablename
-- -----------|-----------
-- public     | activity_logs

-- Note: This enables real-time updates in the Activity Logs page
-- so new activities appear instantly without refreshing 