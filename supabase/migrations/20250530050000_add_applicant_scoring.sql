-- Add AI scoring columns to applicants table
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS score integer CHECK (score >= 0 AND score <= 100),
ADD COLUMN IF NOT EXISTS score_reasons text[];

-- Add index for better performance when sorting by score
CREATE INDEX IF NOT EXISTS idx_applicants_score ON public.applicants(score DESC NULLS LAST); 