-- Make Me Admin Script
-- Run this after the 3 migration parts to convert your user to admin
-- Replace 'your.email@example.com' with your actual email address

UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your.email@example.com';

-- Verify the update
SELECT id, email, name, role 
FROM public.users 
WHERE email = 'your.email@example.com'; 