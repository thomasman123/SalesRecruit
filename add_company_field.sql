-- Add company field to users table if it doesn't exist
-- Run this in Supabase SQL Editor

-- Check if the company column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'company'
  ) THEN
    -- Add the company column
    ALTER TABLE public.users 
    ADD COLUMN company TEXT;
    
    RAISE NOTICE 'Company column added successfully';
  ELSE
    RAISE NOTICE 'Company column already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('company', 'full_access', 'name', 'email', 'role')
ORDER BY column_name; 