import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ThankYou from "./pages/ThankYou";
import Gratis from "./pages/Gratis";
import GratisThankYou from "./pages/GratisThankYou";
import AdminLogin from "./pages/AdminLogin";
import AdminMusic from "./pages/AdminMusic";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();
const DevTestPopup = import.meta.env.DEV ? lazy(() => import("./pages/TestPopup")) : null;

const App = () => {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/gratis" element={<Gratis />} />
                  <Route path="/gratis/gracias" element={<GratisThankYou />} />
                  <Route path="/gracias" element={<ThankYou />} />
                  {import.meta.env.DEV && DevTestPopup && (
                    <Route
                      path="/test-popup"
                      element={
                          <Suspense fallback={null}>
                            <DevTestPopup />
                          </Suspense>
                        }
                      />
                    )}
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/music" element={<AdminMusic />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;
