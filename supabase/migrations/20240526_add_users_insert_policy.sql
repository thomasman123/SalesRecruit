-- Allow authenticated users to insert their own row into public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; -- ensure RLS is on

CREATE POLICY "Users can create their own profile" ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id); 