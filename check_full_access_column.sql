-- Run this in Supabase SQL Editor to check the full_access column status

-- 1. Check if the column exists and its properties
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name = 'full_access';

-- 2. Check current values in the full_access column for recruiters
SELECT 
    id,
    email,
    name,
    role,
    full_access
FROM public.users
WHERE role = 'recruiter'
ORDER BY created_at DESC;

-- 3. Check if there are any constraints or triggers that might be resetting the value
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;

-- 4. Test updating a recruiter's full_access (replace with an actual recruiter ID)
-- UPDATE public.users 
-- SET full_access = true 
-- WHERE role = 'recruiter' 
-- LIMIT 1
-- RETURNING id, email, full_access; 