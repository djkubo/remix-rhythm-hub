import { useEffect, useRef } from "react";
import { useAnalytics } from "./useAnalytics";
import { useDataLayer } from "./useDataLayer";

export const useEngagementTracking = () => {
  const { trackEvent: trackDataLayer } = useDataLayer();
  const { 
    trackPageView, 
    trackEvent, 
    trackScrollDepth, 
    trackTimeOnPage 
  } = useAnalytics();
  
  const scrollMilestones = useRef<Set<number>>(new Set());
  const startTime = useRef<number>(Date.now());
  const timeIntervals = useRef<number[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Track page view (both internal and dataLayer)
    trackPageView();
    trackDataLayer("page_view", {
      page_path: window.location.pathname,
      page_title: document.title,
      page_location: window.location.href,
    });

    // Scroll depth tracking
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      const milestones = [25, 50, 75, 100];
      
      milestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !scrollMilestones.current.has(milestone)) {
          scrollMilestones.current.add(milestone);
          trackScrollDepth(milestone);
          trackDataLayer("scroll_depth", {
            percent: milestone,
            page_path: window.location.pathname,
          });
        }
      });
    };

    // Time on page tracking
    const trackTimeInterval = () => {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);
      const timeThresholds = [30, 60, 120, 180, 300];
      
      timeThresholds.forEach((threshold) => {
        if (timeOnPage >= threshold && !timeIntervals.current.includes(threshold)) {
          timeIntervals.current.push(threshold);
          trackTimeOnPage(threshold);
          trackDataLayer("time_on_page", {
            seconds: threshold,
            page_path: window.location.pathname,
          });
        }
      });
    };

    // Video tracking
    const trackVideoEvents = () => {
      const videos = document.querySelectorAll("video");
      
      videos.forEach((video, index) => {
        const videoMilestones = new Set<number>();

        video.addEventListener("play", () => {
          trackEvent("video_play", { video_index: index });
          trackDataLayer("video_play", { video_index: index });
        });

        video.addEventListener("pause", () => {
          if (!video.ended) {
            const data = {
              video_index: index,
              current_time: Math.round(video.currentTime),
              percent_watched: Math.round((video.currentTime / video.duration) * 100),
            };
            trackEvent("video_pause", data);
            trackDataLayer("video_pause", data);
          }
        });

        video.addEventListener("timeupdate", () => {
          if (!video.duration) return;
          const percent = Math.round((video.currentTime / video.duration) * 100);
          const milestones = [25, 50, 75, 100];
          
          milestones.forEach((milestone) => {
            if (percent >= milestone && !videoMilestones.has(milestone)) {
              videoMilestones.add(milestone);
              trackEvent("video_progress", { video_index: index, percent: milestone });
              trackDataLayer("video_progress", { video_index: index, percent: milestone });
            }
          });
        });
      });
    };

    // Set up listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    const timeInterval = setInterval(trackTimeInterval, 5000);
    setTimeout(trackVideoEvents, 1000);

    // Page exit tracking
    const handleBeforeUnload = () => {
      const totalTime = Math.round((Date.now() - startTime.current) / 1000);
      const maxScroll = Math.max(...Array.from(scrollMilestones.current), 0);
      
      trackEvent("page_exit", { time_on_page: totalTime, max_scroll: maxScroll });
      trackDataLayer("page_exit", { time_on_page: totalTime, max_scroll: maxScroll });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(timeInterval);
    };
  }, [trackPageView, trackEvent, trackScrollDepth, trackTimeOnPage, trackDataLayer]);
};
