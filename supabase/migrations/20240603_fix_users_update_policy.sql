-- Allow authenticated users to update their own row in public.users
-- This fixes the "permission denied for table users" error when sales professionals
-- try to apply for jobs and the upsert operation attempts to update their profile

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 