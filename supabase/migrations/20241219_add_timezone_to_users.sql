-- Add timezone column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_timezone ON public.users(timezone);

-- Update existing users to detect their timezone (you may want to prompt users to set this)
-- This is just a placeholder - in practice, you'd want users to set their own timezone
UPDATE public.users 
SET timezone = 'America/New_York' 
WHERE timezone IS NULL; 