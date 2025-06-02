-- Manual fix to mark your user as onboarded
-- Replace YOUR_EMAIL with your actual email address

UPDATE public.users 
SET onboarded = TRUE 
WHERE email = 'YOUR_EMAIL';

-- Also update auth metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"onboarded": true}'::jsonb
WHERE email = 'YOUR_EMAIL';

-- Verify the update
SELECT id, email, role, onboarded 
FROM public.users 
WHERE email = 'YOUR_EMAIL'; 