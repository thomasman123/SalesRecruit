-- Quick fix: Manually create your user row
-- Replace 'your-email@example.com' with your actual email

-- 1. Find your auth user ID
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'your-email@example.com';

-- 2. Insert your user into public.users (replace the UUID with your actual ID from above)
INSERT INTO public.users (id, email, name, role, onboarded)
VALUES (
    'YOUR-USER-ID-HERE', -- Replace with your actual UUID from step 1
    'your-email@example.com',
    'Your Name', -- Replace with your name
    'sales-professional',
    TRUE -- Set to true so you can access the dashboard
) ON CONFLICT (id) DO UPDATE SET
    onboarded = TRUE;

-- 3. Alternative: Insert based on email (easier)
INSERT INTO public.users (id, email, name, role, onboarded)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'role', 'sales-professional'),
    TRUE -- Mark as onboarded
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE SET
    onboarded = TRUE;

-- 4. Verify it worked
SELECT * FROM public.users WHERE email = 'your-email@example.com'; 