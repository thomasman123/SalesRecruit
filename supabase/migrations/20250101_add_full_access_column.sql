-- Add full_access column to users table for controlling recruiter access
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS full_access BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.users.full_access IS 'Controls whether a recruiter has full access to platform features (granted by admin)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_full_access 
ON public.users(role, full_access) 
WHERE role = 'recruiter'; 