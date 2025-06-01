-- Minimal Admin Setup - Just the essentials
-- If copy/paste is still problematic, just run these key commands:

-- 1. Enable admin role
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('recruiter', 'sales-professional', 'admin'));

-- 2. Update one key policy so admins can see all users
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data or admins can view all"
ON public.users
FOR SELECT
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 3. Make yourself admin (CHANGE THE EMAIL!)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your.email@example.com';

-- 4. Check it worked
SELECT email, role FROM public.users WHERE role = 'admin'; 