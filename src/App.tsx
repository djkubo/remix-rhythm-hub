import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Suspense, lazy } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import AppProviders from "@/components/AppProviders";
import PageLoader from "@/components/PageLoader";
import RouteMenu from "@/components/RouteMenu";
import { routes } from "@/routes";

const DevTestPopup = import.meta.env.DEV ? lazy(() => import("./pages/TestPopup")) : null;

/** Renders the centralised route table from routes.tsx */
function AppRoutes() {
  const devRoutes = import.meta.env.DEV && DevTestPopup
    ? [{
      path: "/test-popup", element: (
        <Suspense fallback={null}>
          <DevTestPopup />
        </Suspense>
      )
    }]
    : [];

  return useRoutes([...routes, ...devRoutes]);
}

const App = () => (
  <AppProviders>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <RouteMenu />
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  </AppProviders>
);

export default App;
