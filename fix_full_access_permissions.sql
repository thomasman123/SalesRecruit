-- Fix permissions for admin users to update full_access column
-- Run this in Supabase SQL Editor

-- 1. First, ensure RLS is enabled on users table (if not already)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Create or replace policy to allow admins to update any user
CREATE POLICY "Admins can update any user" ON public.users
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 3. Alternative: If the above doesn't work, try a more specific policy
CREATE POLICY "Admins can update full_access" ON public.users
FOR UPDATE
USING (
    -- Admin can update any user
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
)
WITH CHECK (
    -- Admin can update any user
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 4. Grant explicit permissions to authenticated users to update the column
GRANT UPDATE (full_access) ON public.users TO authenticated;

-- 5. Verify the policies are created
SELECT 
    polname AS policy_name,
    CASE polcmd 
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command_type
FROM pg_policy
WHERE polrelid = 'public.users'::regclass
ORDER BY polname; 