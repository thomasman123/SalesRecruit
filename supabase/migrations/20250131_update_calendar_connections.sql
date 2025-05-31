-- Update calendar_connections table for enhanced OAuth management

-- Add new columns for better OAuth management
ALTER TABLE public.calendar_connections
ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS oauth_config TEXT,
ADD COLUMN IF NOT EXISTS client_id TEXT;

-- Create index for OAuth config lookup
CREATE INDEX IF NOT EXISTS idx_calendar_connections_oauth_config 
ON public.calendar_connections(oauth_config);

-- Create a table to track OAuth client usage for load balancing
CREATE TABLE IF NOT EXISTS public.oauth_client_usage (
  id SERIAL PRIMARY KEY,
  config_name TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  user_count INTEGER DEFAULT 0,
  max_users INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update OAuth client usage
CREATE OR REPLACE FUNCTION update_oauth_client_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment user count for the OAuth config
    UPDATE public.oauth_client_usage
    SET user_count = user_count + 1,
        updated_at = NOW()
    WHERE config_name = NEW.oauth_config;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement user count for the OAuth config
    UPDATE public.oauth_client_usage
    SET user_count = GREATEST(0, user_count - 1),
        updated_at = NOW()
    WHERE config_name = OLD.oauth_config;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to track OAuth client usage
CREATE TRIGGER track_oauth_client_usage
AFTER INSERT OR DELETE ON public.calendar_connections
FOR EACH ROW
WHEN (NEW.oauth_config IS NOT NULL OR OLD.oauth_config IS NOT NULL)
EXECUTE FUNCTION update_oauth_client_usage();

-- Create a function to get the least loaded OAuth config
CREATE OR REPLACE FUNCTION get_available_oauth_config()
RETURNS TABLE(config_name TEXT, client_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT o.config_name, o.client_id
  FROM public.oauth_client_usage o
  WHERE o.user_count < o.max_users
  ORDER BY (o.user_count::float / o.max_users::float) ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for oauth_client_usage (admin only)
ALTER TABLE public.oauth_client_usage ENABLE ROW LEVEL SECURITY;

-- Only service role can manage OAuth client usage
CREATE POLICY "Service role can manage OAuth client usage" ON public.oauth_client_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE public.oauth_client_usage IS 'Tracks usage of OAuth client IDs for load balancing across multiple Google OAuth apps';
COMMENT ON COLUMN public.calendar_connections.encrypted IS 'Whether the tokens are encrypted in the database';
COMMENT ON COLUMN public.calendar_connections.oauth_config IS 'Which OAuth configuration was used for this connection';
COMMENT ON COLUMN public.calendar_connections.client_id IS 'The OAuth client ID used for this connection'; 