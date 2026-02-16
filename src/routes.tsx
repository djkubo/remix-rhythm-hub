import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

/* ── Lazy page imports ─────────────────────────────────── */

const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ThankYou = lazy(() => import("@/pages/ThankYou"));
const Gratis = lazy(() => import("@/pages/Gratis"));
const GratisThankYou = lazy(() => import("@/pages/GratisThankYou"));
const Usb128 = lazy(() => import("@/pages/Usb128"));
const Usb128ThankYou = lazy(() => import("@/pages/Usb128ThankYou"));
const Usb500gb = lazy(() => import("@/pages/Usb500gb"));
const Usb500gbThankYou = lazy(() => import("@/pages/Usb500gbThankYou"));
const Anual = lazy(() => import("@/pages/Anual"));
const AnualThankYou = lazy(() => import("@/pages/AnualThankYou"));
const Membresia = lazy(() => import("@/pages/Membresia"));
const MembresiaThankYou = lazy(() => import("@/pages/MembresiaThankYou"));
const Explorer = lazy(() => import("@/pages/Explorer"));
const DjEdits = lazy(() => import("@/pages/DjEdits"));
const DjEditsThankYou = lazy(() => import("@/pages/DjEditsThankYou"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminMusic = lazy(() => import("@/pages/AdminMusic"));
const Admin = lazy(() => import("@/pages/Admin"));
const Help = lazy(() => import("@/pages/Help"));
const Login = lazy(() => import("@/pages/Login"));
const TermsAndConditions = lazy(() => import("@/pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));

/* ── Primary routes ────────────────────────────────────── */

const primaryRoutes: RouteObject[] = [
    { path: "/", element: <Index /> },
    { path: "/help", element: <Help /> },
    { path: "/login", element: <Login /> },
    { path: "/terms_and_conditions", element: <TermsAndConditions /> },
    { path: "/privacy_policy", element: <PrivacyPolicy /> },
    { path: "/explorer", element: <Explorer /> },
    { path: "/gracias", element: <ThankYou /> },

    // Products
    { path: "/gratis", element: <Gratis /> },
    { path: "/gratis/gracias", element: <GratisThankYou /> },
    { path: "/usb128", element: <Usb128 /> },
    { path: "/usb128/gracias", element: <Usb128ThankYou /> },
    { path: "/usb500", element: <Usb500gb /> },
    { path: "/usb500/gracias", element: <Usb500gbThankYou /> },
    { path: "/anual", element: <Anual /> },
    { path: "/anual/gracias", element: <AnualThankYou /> },
    { path: "/membresia", element: <Membresia /> },
    { path: "/membresia/gracias", element: <MembresiaThankYou /> },
    { path: "/djedits", element: <DjEdits /> },
    { path: "/djedits/gracias", element: <DjEditsThankYou /> },

    // Admin
    { path: "/admin", element: <Admin /> },
    { path: "/admin/login", element: <AdminLogin /> },
    { path: "/admin/music", element: <AdminMusic /> },
];

/* ── Aliases & legacy redirects ────────────────────────── */
/* Centralised here so App.tsx stays clean.
   Marketing & legacy URLs that must keep working.          */

const aliasRoutes: RouteObject[] = [
    // Navigation aliases
    { path: "/trends", element: <Index /> },
    { path: "/genres", element: <Explorer /> },

    // Legacy hyphenated USB URL
    { path: "/usb-500gb", element: <Navigate to="/usb500" replace /> },
    { path: "/usb-500gb/gracias", element: <Navigate to="/usb500/gracias" replace /> },

    // Uppercase marketing URLs → redirect to canonical
    { path: "/ANUAL", element: <Navigate to="/anual" replace /> },
    { path: "/ANUAL/gracias", element: <Navigate to="/anual/gracias" replace /> },
    { path: "/MEMBRESIA", element: <Navigate to="/membresia" replace /> },
    { path: "/MEMBRESIA/gracias", element: <Navigate to="/membresia/gracias" replace /> },
    { path: "/DJEDITS", element: <Navigate to="/djedits" replace /> },
    { path: "/DJEDITS/gracias", element: <Navigate to="/djedits/gracias" replace /> },

    // Short alias
    { path: "/plan", element: <Navigate to="/membresia" replace /> },
];

/* ── Catch-all ─────────────────────────────────────────── */

const catchAll: RouteObject = { path: "*", element: <NotFound /> };

/* ── Export combined config ────────────────────────────── */

export const routes: RouteObject[] = [
    ...primaryRoutes,
    ...aliasRoutes,
    catchAll,
];
