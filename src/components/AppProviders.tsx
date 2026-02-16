import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import AppErrorBoundary from "@/components/AppErrorBoundary";

const queryClient = new QueryClient();

/**
 * Single wrapper that replaces the nested "provider pyramid" in App.tsx.
 * Keeps all context / error-boundary / query wiring in one place.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
    return (
        <AppErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <LanguageProvider>
                        <CurrencyProvider>
                            <TooltipProvider>
                                {children}
                            </TooltipProvider>
                        </CurrencyProvider>
                    </LanguageProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </AppErrorBoundary>
    );
}
