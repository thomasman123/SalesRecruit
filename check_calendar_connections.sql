-- Check Calendar Connections Status

-- 1. Check if any users have connected their calendars
SELECT 
  'CALENDAR CONNECTIONS OVERVIEW' as report,
  COUNT(*) as total_connections,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN provider = 'google' THEN 1 END) as google_connections
FROM calendar_connections;

-- 2. Show calendar connections with user details
SELECT 
  cc.id,
  u.email,
  u.role,
  cc.provider,
  cc.created_at,
  CASE 
    WHEN cc.access_token IS NOT NULL THEN 'Has Token'
    ELSE 'No Token'
  END as token_status,
  CASE 
    WHEN cc.refresh_token IS NOT NULL THEN 'Has Refresh Token'
    ELSE 'No Refresh Token'
  END as refresh_token_status
FROM calendar_connections cc
JOIN users u ON u.id = cc.user_id
ORDER BY cc.created_at DESC;

-- 3. Check which users DON'T have calendar connections
SELECT 
  u.id,
  u.email,
  u.role,
  'No Calendar Connected' as status
FROM users u
WHERE u.role IN ('recruiter', 'sales-professional')
  AND NOT EXISTS (
    SELECT 1 FROM calendar_connections cc 
    WHERE cc.user_id = u.id
  )
ORDER BY u.role, u.email;

-- 4. Check recent scheduled interviews and their calendar status
SELECT 
  si.id,
  si.scheduled_date,
  si.scheduled_time,
  si.meeting_link,
  si.calendar_event_id,
  ur.email as recruiter_email,
  us.email as sales_rep_email,
  si.created_at
FROM scheduled_interviews si
JOIN users ur ON ur.id = si.recruiter_id
JOIN users us ON us.id = si.sales_rep_id
ORDER BY si.created_at DESC
LIMIT 10; 