import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { LandingScreen } from "@/pages/landing-screen";

import { TemplateScreen } from "@/pages/template-screen";
import { DashboardScreen } from "@/pages/dashboard-screen";
import { AiWebsiteSetupScreen } from "@/pages/ai-website-setup-screen";
import { TemplateOneScreen } from "@/pages/template-one-screen";
import { OwnerGuideScreen } from "@/pages/owner-guide-screen";
import { PopupPage } from "@/pages/popup-page";
import { RequestsScreen } from "@/pages/requests-screen";
import { DesignSystemScreen } from "@/pages/design-system-screen";
import { HomeTwoScreen } from "@/pages/home-two-screen";
import { ClientScreen } from "@/pages/client-screen";
import { ChatWidgetScreen } from "@/pages/chat-widget-screen";
import { SettingsScreen } from "@/pages/settings-screen";
import { RoadmapScreen } from "@/pages/roadmap-screen";
import { ThemeToggle } from "@/components/base/theme-toggle/theme-toggle";
import { HelpMenu } from "@/components/application/help-menu";
import { NotFound } from "@/pages/not-found";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/styles/globals.css";

// Internal app pages render their own theme chrome inside the icon rail, so the
// floating toggle is hidden there to avoid duplicates. The account avatar is NOT
// shown globally — it's a team-only settings shortcut that lives in the dashboard
// rail, and it must never appear on client-facing pages (owner guides, popups, etc.).
const PAGES_WITHOUT_FLOATING_CHROME = ["/designsystem", "/home2", "/dashboard", "/webteam/ai-website-setup", "/template-1", "/settings", "/roadmap"];

// The floating "?" help menu is a team tool. It renders ONLY on internal team
// pages and is hidden on every client-facing page — all client slugs
// (`/{client}-leadcapture`, `-chatwidget`, `-metapixel`, `-dashboard`), owner
// guides, and the shareable templates (`/popup`, `/chat-widget`, `/metapixel`) —
// so it never appears on anything shared with a client.
const PAGES_WITH_HELP_MENU = [
    "/",
    "/dashboard",
    "/roadmap",
    "/requests",
    "/settings",
    "/designsystem",
    "/home2",
    "/template",
    "/template-1",
    "/webteam/ai-website-setup",
];

const GlobalThemeToggle = () => {
    const { pathname } = useLocation();
    // Owner-guide pages have their own theme toggle in the sidebar (incl. /owner-guide/:slug).
    if (PAGES_WITHOUT_FLOATING_CHROME.includes(pathname) || pathname.startsWith("/owner-guide")) return null;
    return <ThemeToggle />;
};

const GlobalHelpMenu = () => {
    const { pathname } = useLocation();
    if (!PAGES_WITH_HELP_MENU.includes(pathname)) return null;
    return <HelpMenu />;
};

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <RouteProvider>
                    <GlobalThemeToggle />
                    <GlobalHelpMenu />
                    <Routes>
                        <Route path="/" element={<LandingScreen />} />

                        <Route path="/template" element={<TemplateScreen />} />
                        <Route path="/dashboard" element={<DashboardScreen />} />
                        <Route path="/webteam/ai-website-setup" element={<AiWebsiteSetupScreen />} />
                        <Route path="/template-1" element={<TemplateOneScreen />} />
                        <Route path="/owner-guide" element={<OwnerGuideScreen />} />
                        <Route path="/owner-guide/:slug" element={<OwnerGuideScreen />} />
                        <Route path="/popup" element={<PopupPage />} />
                        <Route path="/requests" element={<RequestsScreen />} />
                        <Route path="/designsystem" element={<DesignSystemScreen />} />
                        <Route path="/home2" element={<HomeTwoScreen />} />
                        <Route path="/settings" element={<SettingsScreen />} />
                        <Route path="/roadmap" element={<RoadmapScreen />} />
                        <Route path="/chat-widget" element={<ChatWidgetScreen isTemplate />} />
                        <Route path="/:clientSlug" element={<ClientScreen />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </RouteProvider>
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>,
);
