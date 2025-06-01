-- Check Existing Interview Invitations

-- 1. Show all interview invitations
SELECT 
  n.id,
  n.user_id,
  u.email as invited_user_email,
  u.role as user_role,
  n.title,
  n.created_at,
  n.metadata->>'jobId' as job_id,
  n.metadata->>'jobTitle' as job_title,
  n.metadata->>'company' as company,
  n.metadata->>'recruiterName' as recruiter_name
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE n.title LIKE '%Interview Invitation%'
ORDER BY n.created_at DESC;

-- 2. Count invitations by job
SELECT 
  n.metadata->>'jobId' as job_id,
  n.metadata->>'jobTitle' as job_title,
  COUNT(*) as invitation_count
FROM notifications n
WHERE n.title LIKE '%Interview Invitation%'
GROUP BY n.metadata->>'jobId', n.metadata->>'jobTitle'
ORDER BY invitation_count DESC;

-- 3. Check for duplicate invitations (same user invited multiple times for same job)
WITH invitation_counts AS (
  SELECT 
    n.user_id,
    n.metadata->>'jobId' as job_id,
    COUNT(*) as invite_count
  FROM notifications n
  WHERE n.title LIKE '%Interview Invitation%'
  GROUP BY n.user_id, n.metadata->>'jobId'
  HAVING COUNT(*) > 1
)
SELECT 
  ic.*,
  u.email,
  u.name
FROM invitation_counts ic
JOIN users u ON u.id = ic.user_id;

-- 4. Show applicants with their invitation status for a specific job
-- Replace JOB_ID with the actual job ID
WITH job_invitations AS (
  SELECT 
    n.user_id,
    n.created_at as invited_at
  FROM notifications n
  WHERE n.title LIKE '%Interview Invitation%'
    AND n.metadata->>'jobId' = 'JOB_ID'
)
SELECT 
  a.id as applicant_id,
  a.name as applicant_name,
  a.email as applicant_email,
  a.user_id,
  a.status,
  CASE 
    WHEN ji.user_id IS NOT NULL THEN 'Invited'
    ELSE 'Not Invited'
  END as invitation_status,
  ji.invited_at
FROM applicants a
LEFT JOIN job_invitations ji ON ji.user_id = a.user_id
WHERE a.job_id = JOB_ID
ORDER BY a.created_at DESC; 