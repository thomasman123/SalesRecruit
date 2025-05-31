-- Emergency fix: Add encrypted column to calendar_connections
ALTER TABLE public.calendar_connections
ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false; 