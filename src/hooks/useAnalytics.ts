import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Generate a unique visitor ID (persisted in localStorage)
const getVisitorId = (): string => {
  const key = "vrp_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};

// Generate a session ID (persisted in sessionStorage)
const getSessionId = (): string => {
  const key = "vrp_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
};

// Detect country from timezone (lightweight, no API call)
const detectCountryFromTimezone = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryMap: Record<string, string> = {
      "America/Mexico_City": "MX",
      "America/New_York": "US",
      "America/Los_Angeles": "US",
      "America/Chicago": "US",
      "America/Bogota": "CO",
      "America/Lima": "PE",
      "America/Santiago": "CL",
      "America/Buenos_Aires": "AR",
      "America/Sao_Paulo": "BR",
      "Europe/Madrid": "ES",
      "Europe/London": "GB",
    };
    return countryMap[timezone] || "XX";
  } catch {
    return "XX";
  }
};

interface AnalyticsEvent {
  event_name: string;
  event_data?: Json;
  page_path?: string;
}

export const useAnalytics = () => {
  const visitorId = useRef<string>("");
  const sessionId = useRef<string>("");
  const countryCode = useRef<string>("");
  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const isProcessing = useRef(false);

  useEffect(() => {
    visitorId.current = getVisitorId();
    sessionId.current = getSessionId();
    countryCode.current = detectCountryFromTimezone();
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || eventQueue.current.length === 0) return;
    
    isProcessing.current = true;
    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      const records = events.map((event) => ({
        event_name: event.event_name,
        event_data: (event.event_data || {}) as Json,
        page_path: event.page_path || window.location.pathname,
        session_id: sessionId.current,
        visitor_id: visitorId.current,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        country_code: countryCode.current,
      }));

      const { error } = await supabase.from("analytics_events").insert(records);
      
      if (error) {
        console.error("Analytics error:", error);
        // Re-queue failed events
        eventQueue.current = [...events, ...eventQueue.current];
      }
    } catch (err) {
      console.error("Analytics error:", err);
    } finally {
      isProcessing.current = false;
    }
  }, []);

  // Process queue every 2 seconds (batch inserts for performance)
  useEffect(() => {
    const interval = setInterval(processQueue, 2000);
    
    // Process remaining events before page unload
    const handleUnload = () => {
      if (eventQueue.current.length > 0) {
        // Use sendBeacon for reliability on page exit
        const events = eventQueue.current.map((event) => ({
          event_name: event.event_name,
          event_data: event.event_data || {},
          page_path: event.page_path || window.location.pathname,
          session_id: sessionId.current,
          visitor_id: visitorId.current,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          country_code: countryCode.current,
        }));
        
        // Fallback: try to send synchronously
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_events`,
          JSON.stringify(events)
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [processQueue]);

  const trackEvent = useCallback((eventName: string, eventData?: Record<string, unknown>) => {
    eventQueue.current.push({
      event_name: eventName,
      event_data: (eventData || {}) as Json,
      page_path: window.location.pathname,
    });
  }, []);

  const trackPageView = useCallback(() => {
    trackEvent("page_view", {
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [trackEvent]);

  const trackClick = useCallback((buttonText: string) => {
    trackEvent("click", {
      button_text: buttonText,
      page_location: window.location.href,
    });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formId: string) => {
    trackEvent("form_submit", { form_id: formId });
  }, [trackEvent]);

  const trackScrollDepth = useCallback((percent: number) => {
    trackEvent("scroll_depth", { percent });
  }, [trackEvent]);

  const trackTimeOnPage = useCallback((seconds: number) => {
    trackEvent("time_on_page", { seconds });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackFormSubmit,
    trackScrollDepth,
    trackTimeOnPage,
  };
};
