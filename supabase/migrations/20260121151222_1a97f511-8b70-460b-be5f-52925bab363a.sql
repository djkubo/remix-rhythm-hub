-- Create analytics_events table to store all tracking events
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_path TEXT,
  session_id TEXT,
  visitor_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  country_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_page_path ON public.analytics_events(page_path);
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_visitor ON public.analytics_events(visitor_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (anonymous tracking)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Only admins can view analytics"
ON public.analytics_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create daily aggregates view for performance
CREATE OR REPLACE VIEW public.analytics_daily_summary AS
SELECT 
  DATE(created_at) as date,
  event_name,
  page_path,
  COUNT(*) as event_count,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.analytics_events
GROUP BY DATE(created_at), event_name, page_path
ORDER BY date DESC, event_count DESC;