-- Fix security definer view - add security_invoker
DROP VIEW IF EXISTS public.analytics_daily_summary;

CREATE VIEW public.analytics_daily_summary 
WITH (security_invoker = on) AS
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