-- Grant full access to recruiter users
-- Replace 'your-email@example.com' with your actual email

-- 1. First check if the full_access column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'full_access';

-- 2. If it doesn't exist, add it
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS full_access BOOLEAN DEFAULT FALSE;

-- 3. Grant full access to your user
UPDATE public.users 
SET full_access = TRUE 
WHERE email = 'your-email@example.com';

-- 4. Alternatively, grant full access to all recruiters
UPDATE public.users 
SET full_access = TRUE 
WHERE role = 'recruiter';

-- 5. Verify the update
SELECT id, email, role, full_access 
FROM public.users 
WHERE email = 'your-email@example.com'; 