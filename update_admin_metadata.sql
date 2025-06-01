-- Update Admin User Metadata
-- This updates the auth metadata to include the admin role
-- Replace 'your.email@example.com' with your actual email

-- First, get the user ID
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID for the email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'your.email@example.com';
  
  -- Update the raw_user_meta_data to include the role
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    '{"role": "admin"}'::jsonb
  WHERE id = user_id;
  
  RAISE NOTICE 'Updated user metadata for %', user_id;
END $$;

-- Verify the update
SELECT 
  email,
  raw_user_meta_data->>'role' as metadata_role,
  (SELECT role FROM public.users WHERE id = auth.users.id) as db_role
FROM auth.users
WHERE email = 'your.email@example.com'; 