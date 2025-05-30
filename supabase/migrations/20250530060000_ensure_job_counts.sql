-- Ensure views and applicants_count columns exist in jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS applicants_count integer DEFAULT 0; 