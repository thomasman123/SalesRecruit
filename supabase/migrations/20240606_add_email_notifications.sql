-- Add email notification preferences table
CREATE TABLE IF NOT EXISTS public.email_notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_notifications_enabled BOOLEAN DEFAULT true,
  notification_frequency TEXT NOT NULL CHECK (notification_frequency IN ('immediate', 'daily', 'weekly')) DEFAULT 'immediate',
  last_notification_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Add email notification history table
CREATE TABLE IF NOT EXISTS public.email_notification_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'opened', 'clicked')) DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.email_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notification_history ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.email_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.email_notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view their own notification history
CREATE POLICY "Users can view their own notification history"
  ON public.email_notification_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to update notification preferences
CREATE OR REPLACE FUNCTION public.update_notification_preferences(
  p_user_id UUID,
  p_job_notifications_enabled BOOLEAN,
  p_notification_frequency TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.email_notification_preferences (
    user_id,
    job_notifications_enabled,
    notification_frequency
  )
  VALUES (
    p_user_id,
    p_job_notifications_enabled,
    p_notification_frequency
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    job_notifications_enabled = EXCLUDED.job_notifications_enabled,
    notification_frequency = EXCLUDED.notification_frequency,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record notification sent
CREATE OR REPLACE FUNCTION public.record_notification_sent(
  p_user_id UUID,
  p_job_id BIGINT,
  p_status TEXT DEFAULT 'sent',
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.email_notification_history (
    user_id,
    job_id,
    status,
    error_message
  )
  VALUES (
    p_user_id,
    p_job_id,
    p_status,
    p_error_message
  );

  -- Update last notification sent timestamp
  UPDATE public.email_notification_preferences
  SET last_notification_sent = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 