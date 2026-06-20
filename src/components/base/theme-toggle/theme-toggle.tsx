import { useTheme } from "@/providers/theme-provider";

const SunIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
);

const MoonIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

export const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();

    const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const toggle = () => setTheme(isDark ? "light" : "dark");

    return (
        <button
            type="button"
            onClick={toggle}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="fixed right-4 top-4 z-50 flex size-9 items-center justify-center rounded-full border border-secondary bg-primary text-secondary shadow-sm transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
        >
            {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
    );
};
