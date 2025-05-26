-- Add user_id column to applicants table to link to the authenticated user who applied
ALTER TABLE public.applicants
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applicants_user_id_fkey'
  ) THEN
    ALTER TABLE public.applicants
      ADD CONSTRAINT applicants_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- Back-fill user_id for existing applicants by matching email
UPDATE public.applicants AS a
SET user_id = u.id
FROM public.users AS u
WHERE a.email = u.email
  AND a.user_id IS NULL;

-- Update the RLS policies to allow sales professionals to view their own applications
-- using the new user_id column
DROP POLICY IF EXISTS "Sales professionals can view their own applications" ON public.applicants;

CREATE POLICY "Sales professionals can view their own applications"
ON public.applicants
FOR SELECT
USING (
  -- Allow select if the user_id matches the authenticated user OR email matches (for backward compatibility)
  user_id = auth.uid() OR email = (SELECT email FROM public.users WHERE id = auth.uid())
);

-- Update the insert policy to set user_id when inserting
DROP POLICY IF EXISTS "Sales professionals can apply to jobs" ON public.applicants;

CREATE POLICY "Sales professionals can apply to jobs"
ON public.applicants
FOR INSERT
WITH CHECK (
  -- Allow insert if the email matches the authenticated user's email from public.users
  -- and user_id is set to the authenticated user's id
  email = (SELECT email FROM public.users WHERE id = auth.uid()) AND
  (user_id = auth.uid() OR user_id IS NULL)
); 