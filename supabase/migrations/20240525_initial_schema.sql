-- Create tables for the sales recruitment platform

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('recruiter', 'sales-professional')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  avatar_url TEXT
);

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'draft', 'closed')),
  industry TEXT NOT NULL,
  price_range TEXT NOT NULL,
  lead_source TEXT NOT NULL,
  commission_structure TEXT NOT NULL,
  team_size TEXT NOT NULL,
  remote_compatible BOOLEAN NOT NULL DEFAULT FALSE,
  company_overview TEXT,
  what_you_sell TEXT,
  sales_process TEXT,
  whats_provided TEXT[],
  not_for TEXT,
  commission_breakdown TEXT,
  ramp_time TEXT,
  working_hours TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0 NOT NULL,
  applicants_count INTEGER DEFAULT 0 NOT NULL
);

-- Applicants table
CREATE TABLE IF NOT EXISTS public.applicants (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT NOT NULL,
  applied_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'reviewing', 'interviewing', 'hired', 'rejected')),
  starred BOOLEAN DEFAULT FALSE NOT NULL,
  experience TEXT NOT NULL,
  highest_ticket TEXT NOT NULL,
  sales_style TEXT NOT NULL,
  tools TEXT NOT NULL,
  video_url TEXT,
  notes TEXT,
  job_id BIGINT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  avatar_url TEXT
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id BIGSERIAL PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  applicant_id BIGINT NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  last_message_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  unread_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL, -- Can be either recruiter_id or applicant_id
  sender_type TEXT NOT NULL CHECK (sender_type IN ('recruiter', 'applicant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_applicants_job_id ON public.applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_conversations_recruiter_id ON public.conversations(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_conversations_applicant_id ON public.conversations(applicant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at
BEFORE UPDATE ON public.applicants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Create policies for jobs table
CREATE POLICY "Recruiters can manage their own jobs"
ON public.jobs
FOR ALL
USING (auth.uid() = recruiter_id);

CREATE POLICY "Everyone can view active jobs"
ON public.jobs
FOR SELECT
USING (status = 'active');

-- Create policies for applicants table
CREATE POLICY "Recruiters can view applicants for their jobs"
ON public.applicants
FOR SELECT
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
  )
);

CREATE POLICY "Recruiters can manage applicants for their jobs"
ON public.applicants
FOR ALL
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
  )
);

-- Create policies for conversations table
CREATE POLICY "Recruiters can manage their conversations"
ON public.conversations
FOR ALL
USING (recruiter_id = auth.uid());

-- Create policies for messages table
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE recruiter_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE recruiter_id = auth.uid()
  )
);
