import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { LandingScreen } from "@/pages/landing-screen";
import { TeamGuideScreen } from "@/pages/team-guide-screen";
import { TemplateScreen } from "@/pages/template-screen";
import { DashboardScreen } from "@/pages/dashboard-screen";
import { ClientScreen } from "@/pages/client-screen";
import { NotFound } from "@/pages/not-found";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <RouteProvider>
                    <Routes>
                        <Route path="/" element={<LandingScreen />} />
                        <Route path="/team" element={<TeamGuideScreen />} />
                        <Route path="/template" element={<TemplateScreen />} />
                        <Route path="/dashboard" element={<DashboardScreen />} />
                        <Route path="/:clientSlug" element={<ClientScreen />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </RouteProvider>
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>,
);
