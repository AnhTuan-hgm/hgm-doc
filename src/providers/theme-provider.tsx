import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Theme = "light" | "dark" | "system";

/** Users whose pages default to dark mode (until they explicitly pick a theme). */
const DARK_MODE_DEFAULT_USERS = ["anhtuan@hiddengem.media"];

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
    /**
     * The class to add to the root element when the theme is dark
     * @default "dark-mode"
     */
    darkModeClass?: string;
    /**
     * The default theme to use if no theme is stored in localStorage
     * @default "system"
     */
    defaultTheme?: Theme;
    /**
     * The key to use to store the theme in localStorage
     * @default "ui-theme"
     */
    storageKey?: string;
}

export const ThemeProvider = ({ children, defaultTheme = "system", storageKey = "ui-theme", darkModeClass = "dark-mode" }: ThemeProviderProps) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem(storageKey) as Theme | null;
            return savedTheme || defaultTheme;
        }
        return defaultTheme;
    });

    // For specific users (e.g. anhtuan@hiddengem.media), default every page to dark
    // mode — but only if they haven't already chosen a theme on this device, so a
    // manual toggle still wins. Runs on mount and whenever the auth state changes
    // (e.g. returning from the dashboard Google OAuth redirect).
    useEffect(() => {
        const applyUserDefault = (email: string | undefined) => {
            if (localStorage.getItem(storageKey)) return; // user already picked a theme
            if (email && DARK_MODE_DEFAULT_USERS.includes(email.toLowerCase())) {
                setTheme("dark");
            }
        };

        supabase.auth.getSession().then(({ data }) => applyUserDefault(data.session?.user?.email));

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            applyUserDefault(session?.user?.email);
        });

        return () => sub.subscription.unsubscribe();
    }, [storageKey]);

    useEffect(() => {
        const applyTheme = () => {
            const root = window.document.documentElement;

            if (theme === "system") {
                const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

                root.classList.toggle(darkModeClass, systemTheme === "dark");
                localStorage.removeItem(storageKey);
            } else {
                root.classList.toggle(darkModeClass, theme === "dark");
                localStorage.setItem(storageKey, theme);
            }
        };

        applyTheme();

        // Listen for system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = () => {
            if (theme === "system") {
                applyTheme();
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
