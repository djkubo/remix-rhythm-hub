import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileStickyBar = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          {/* Gradient fade above */}
          <div className="h-6 bg-gradient-to-t from-black to-transparent" />
          
          {/* Sticky bar content */}
          <div className="flex items-center justify-between gap-4 bg-black/95 px-4 py-3 backdrop-blur-xl border-t border-white/10">
            <p className="text-sm text-muted-foreground">
              ¿Listo para descargar?
            </p>
            <Button
              asChild
              size="sm"
              className="h-10 gap-2 bg-gradient-to-r from-primary via-red-600 to-orange-500 px-5 font-bold shadow-lg shadow-primary/30 animate-pulse"
            >
              <a href="https://videoremixespacks.com/plan">
                <Zap className="h-4 w-4" />
                Empezar Ahora
              </a>
            </Button>
          </div>
          
          {/* Safe area for iOS */}
          <div className="h-[env(safe-area-inset-bottom)] bg-black/95" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileStickyBar;
