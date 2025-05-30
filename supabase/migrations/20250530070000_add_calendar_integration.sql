-- Calendar connections table for storing Google Calendar OAuth tokens
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  calendar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Calendar availability table for storing user availability
CREATE TABLE IF NOT EXISTS public.calendar_availability (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);

-- Scheduled interviews table
CREATE TABLE IF NOT EXISTS public.scheduled_interviews (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id INTEGER NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES public.users(id),
  sales_rep_id UUID NOT NULL REFERENCES public.users(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  meeting_link TEXT,
  calendar_event_id TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  additional_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON public.calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_availability_user_id ON public.calendar_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_job_id ON public.scheduled_interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_applicant_id ON public.scheduled_interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_date ON public.scheduled_interviews(scheduled_date);

-- Add RLS policies
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_interviews ENABLE ROW LEVEL SECURITY;

-- Calendar connections policies
CREATE POLICY "Users can view own calendar connections" ON public.calendar_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar connections" ON public.calendar_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar connections" ON public.calendar_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar connections" ON public.calendar_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar availability policies
CREATE POLICY "Users can view own availability" ON public.calendar_availability
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own availability" ON public.calendar_availability
  FOR ALL USING (auth.uid() = user_id);

-- Scheduled interviews policies
CREATE POLICY "Recruiters can view their scheduled interviews" ON public.scheduled_interviews
  FOR SELECT USING (auth.uid() = recruiter_id);

CREATE POLICY "Sales reps can view their scheduled interviews" ON public.scheduled_interviews
  FOR SELECT USING (auth.uid() = sales_rep_id);

CREATE POLICY "Recruiters can create interviews" ON public.scheduled_interviews
  FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update their interviews" ON public.scheduled_interviews
  FOR UPDATE USING (auth.uid() = recruiter_id); 