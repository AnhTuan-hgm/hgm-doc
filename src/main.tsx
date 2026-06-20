import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { LandingScreen } from "@/pages/landing-screen";
import { TeamGuideScreen } from "@/pages/team-guide-screen";
import { TemplateScreen } from "@/pages/template-screen";
import { DashboardScreen } from "@/pages/dashboard-screen";
import { AiWebsiteSetupScreen } from "@/pages/ai-website-setup-screen";
import { ClientScreen } from "@/pages/client-screen";
import { ThemeToggle } from "@/components/base/theme-toggle/theme-toggle";
import { NotFound } from "@/pages/not-found";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/styles/globals.css";

const GlobalThemeToggle = () => {
    const { pathname } = useLocation();
    if (pathname === "/webteam/ai-website-setup") return null;
    return <ThemeToggle />;
};

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <RouteProvider>
                    <GlobalThemeToggle />
                    <Routes>
                        <Route path="/" element={<LandingScreen />} />
                        <Route path="/team" element={<TeamGuideScreen />} />
                        <Route path="/template" element={<TemplateScreen />} />
                        <Route path="/dashboard" element={<DashboardScreen />} />
                        <Route path="/webteam/ai-website-setup" element={<AiWebsiteSetupScreen />} />
                        <Route path="/:clientSlug" element={<ClientScreen />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </RouteProvider>
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>,
);
