-- Diagnostic SQL to check jobs table structure

-- 1. Check what columns exist in the jobs table
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if company_overview column exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'jobs' 
  AND column_name = 'company_overview'
) as has_company_overview;

-- 3. Check a sample of jobs data to see what's there
SELECT 
  id,
  title,
  company_overview,
  industry,
  price_range,
  commission_structure,
  remote_compatible
FROM jobs
LIMIT 5;

-- 4. If you need to add company_overview safely:
-- This will only add it if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' 
    AND column_name = 'company_overview'
  ) THEN
    ALTER TABLE jobs ADD COLUMN company_overview TEXT;
    RAISE NOTICE 'Added company_overview column to jobs table';
  ELSE
    RAISE NOTICE 'company_overview column already exists';
  END IF;
END $$; 