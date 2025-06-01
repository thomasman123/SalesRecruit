-- Allow authenticated users to insert their own row into public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; -- ensure RLS is on

-- Drop policy if it exists
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;

-- Create the policy
CREATE POLICY "Users can create their own profile" ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id); 